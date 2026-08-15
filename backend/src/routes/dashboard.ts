import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Base conditions for filtering by branch if admin
    const branchCondition = user.role === 'admin' ? { branchId: user.branchId } : {};

    // 1. Basic Counts
    const [students, teachers, groups, branches] = await Promise.all([
      prisma.student.count({ where: { status: 'active', ...branchCondition } }),
      prisma.user.count({ where: { role: 'teacher', isActive: true, ...branchCondition } }),
      prisma.group.count({ where: { status: 'active', ...branchCondition } }),
      prisma.branch.count() // Branches count ignores admin filter usually
    ]);

    // 2. Financials (Income)
    // All payments
    const allPayments = await prisma.payment.findMany({
      where: branchCondition,
      select: { amount: true, date: true, branchId: true }
    });

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const prevMonthDate = new Date();
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonth = prevMonthDate.getMonth();
    const prevYear = prevMonthDate.getFullYear();

    let thisMonthIncome = 0;
    let prevMonthIncome = 0;

    // Best branch tracking
    const branchIncomes: Record<string, number> = {};

    allPayments.forEach(p => {
      const d = new Date(p.date);
      const amt = Number(p.amount);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        thisMonthIncome += amt;
        
        // Track for best branch
        if (!branchIncomes[p.branchId]) branchIncomes[p.branchId] = 0;
        branchIncomes[p.branchId] += amt;
      } else if (d.getFullYear() === prevYear && d.getMonth() === prevMonth) {
        prevMonthIncome += amt;
      }
    });

    let growth_percent = 0;
    if (prevMonthIncome > 0) {
      growth_percent = ((thisMonthIncome - prevMonthIncome) / prevMonthIncome) * 100;
    } else if (thisMonthIncome > 0) {
      growth_percent = 100; // From 0 to something is 100% growth
    }

    // Monthly income for the last 6 months
    const uzbekMonths = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
    const monthly_income = [];
    let totalSixMonthsIncome = 0;
    let monthsWithIncome = 0;

    for (let i = 5; i >= 0; i--) {
      let targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() - i);
      const mIdx = targetDate.getMonth();
      const yIdx = targetDate.getFullYear();
      
      const monthTotal = allPayments.reduce((acc, p) => {
        const d = new Date(p.date);
        if (d.getFullYear() === yIdx && d.getMonth() === mIdx) {
          return acc + Number(p.amount);
        }
        return acc;
      }, 0);

      monthly_income.push({
        name: uzbekMonths[mIdx],
        Umumiy: monthTotal
      });

      if (monthTotal > 0) {
        totalSixMonthsIncome += monthTotal;
        monthsWithIncome++;
      }
    }

    const average_income = monthsWithIncome > 0 ? totalSixMonthsIncome / monthsWithIncome : 0;

    // Find Best Branch
    let best_branch = { name: "Noma'lum", amount: 0 };
    if (Object.keys(branchIncomes).length > 0) {
      let bestBranchId = Object.keys(branchIncomes)[0];
      for (const bId in branchIncomes) {
        if (branchIncomes[bId] > branchIncomes[bestBranchId]) {
          bestBranchId = bId;
        }
      }
      const branchDb = await prisma.branch.findUnique({ where: { id: bestBranchId } });
      if (branchDb) {
        best_branch = { name: branchDb.name, amount: branchIncomes[bestBranchId] };
      }
    }

    // New Students this month
    const new_students = await prisma.student.count({
      where: {
        ...branchCondition,
        createdAt: {
          gte: new Date(currentYear, currentMonth, 1)
        }
      }
    });

    res.json({
      students,
      teachers,
      groups,
      branches,
      income: thisMonthIncome,
      monthly_income,
      average_income,
      growth_percent: Math.round(growth_percent),
      best_branch,
      new_students
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: "Xatolik yuz berdi" });
  }
});

export default router;
