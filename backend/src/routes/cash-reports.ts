import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authorize, protect } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.use(protect);

// Get all cash reports
router.get('/', authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const user = (req as any).user;
    
    let whereClause = {};
    if (user.role === 'admin') {
      whereClause = { branchId: user.branchId };
    }

    const reports = await prisma.cashReport.findMany({
      where: whereClause,
      include: {
        adder: {
          select: { name: true }
        },
        branch: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create cash report (Kassani yopish)
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const user = (req as any).user;
    const { branchId } = req.body; 

    await prisma.$transaction(async (tx) => {
      // 1. Find all pending payments for this admin that don't have a cashReportId
      const pendingPayments = await tx.payment.findMany({
        where: {
          addedBy: user.id,
          cashReportId: null
        }
      });

      if (pendingPayments.length === 0) {
        throw new Error('No pending payments to report');
      }

      // 2. Calculate totals
      let cash = 0;
      let card = 0;
      let bank = 0;

      for (const p of pendingPayments) {
        if (p.method === 'naqd') cash += Number(p.amount);
        if (p.method === 'karta') card += Number(p.amount);
        if (p.method === 'hisob') bank += Number(p.amount);
      }
      
      const total = cash + card + bank;

      // 3. Create Cash Report
      const report = await tx.cashReport.create({
        data: {
          branchId: branchId || user.branchId,
          addedBy: user.id,
          date: new Date(),
          totalAmount: total,
          cashAmount: cash,
          cardAmount: card,
          bankAmount: bank,
          status: 'pending'
        }
      });

      // 4. Update payments to point to this report
      await tx.payment.updateMany({
        where: {
          addedBy: user.id,
          cashReportId: null
        },
        data: {
          cashReportId: report.id
        }
      });

      return report;
    });

    res.status(201).json({ message: 'Cash report created successfully' });
  } catch (error: any) {
    console.error('Error creating cash report:', error);
    if (error.message === 'No pending payments to report') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Update cash report status (superadmin only)
router.put('/:id', authorize('superadmin'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const reportId = req.params.id as string;
    const report = await prisma.cashReport.update({
      where: { id: reportId },
      data: { status }
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
