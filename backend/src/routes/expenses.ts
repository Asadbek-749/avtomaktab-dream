import express from 'express';
import { prisma } from '../prisma';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', authorize('superadmin', 'admin'), async (req: any, res: any) => {
  try {
    const user = req.user;
    const whereClause = user.role === 'superadmin' ? {} : { branchId: user.branchId };
    
    const expenses = await prisma.expense.findMany({
      where: whereClause,
    });

    const instructorPayments = await prisma.instructorPayment.findMany({
      where: whereClause,
    });

    const merged = [
      ...expenses,
      ...instructorPayments.map(p => ({
        id: p.id,
        amount: p.amount,
        category: 'salary',
        date: p.date,
        note: `Instruktor avans: ${p.note || ''}`,
        branchId: p.branchId,
        addedBy: p.addedBy,
        createdAt: p.createdAt,
        isInstructorPayment: true
      }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    res.json(merged);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { amount, category, date, note, branchId } = req.body;
    const addedBy = (req as any).user.id;
    
    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        note,
        branchId,
        addedBy
      }
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const expenseId = req.params.id as string;
    const user = (req as any).user;
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    const userName = dbUser?.name || 'Noma\'lum xodim';

    const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!expense) {
      const instPayment = await prisma.instructorPayment.findUnique({ where: { id: expenseId } });
      if (!instPayment) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.instructorPayment.delete({ where: { id: expenseId } });
        await tx.activityLog.create({
          data: {
            action: 'DELETED_INSTRUCTOR_PAYMENT',
            details: `Instruktor avans o'chirildi: ${instPayment.amount} so'm`,
            userId: user.id,
            userName: userName,
            branchId: instPayment.branchId
          }
        });
      });
      return res.json({ message: 'Instructor payment deleted successfully' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.expense.delete({ where: { id: expenseId } });

      await tx.activityLog.create({
        data: {
          action: 'DELETED_EXPENSE',
          details: `Xarajat o'chirildi: ${expense.amount} so'm (${expense.category})`,
          userId: user.id,
          userName: userName,
          branchId: expense.branchId
        }
      });
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
