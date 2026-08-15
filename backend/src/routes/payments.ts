import express from 'express';
import { prisma } from '../prisma';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', async (req: any, res: any) => {
  try {
    const user = req.user;
    const whereClause = user.role === 'superadmin' ? {} : { branchId: user.branchId };
    const payments = await prisma.payment.findMany({ where: whereClause });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { amount, date, note, studentId, branchId, method } = req.body;
    const addedBy = (req as any).user.id;
    const paymentAmount = parseFloat(amount);
    const paymentMethod = method || 'naqd';
    
    const paymentDate = new Date(date);
    const startOfDay = new Date(paymentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(paymentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Payment
      const payment = await tx.payment.create({
        data: {
          amount: paymentAmount,
          date: new Date(date),
          note,
          studentId,
          branchId,
          addedBy,
          method: paymentMethod
        }
      });

      // 2. Update Student paidAmount
      await tx.student.update({
        where: { id: studentId },
        data: {
          paidAmount: {
            increment: paymentAmount
          }
        }
      });

      // 3. Find or Create CashReport for today
      let cashReport = await tx.cashReport.findFirst({
        where: {
          branchId,
          date: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: 'pending'
        }
      });

      if (!cashReport) {
        cashReport = await tx.cashReport.create({
          data: {
            date: new Date(),
            totalAmount: paymentAmount,
            cashAmount: paymentMethod === 'naqd' ? paymentAmount : 0,
            cardAmount: paymentMethod === 'karta' ? paymentAmount : 0,
            bankAmount: paymentMethod === 'hisob' ? paymentAmount : 0,
            branchId,
            addedBy
          }
        });
      } else {
        await tx.cashReport.update({
          where: { id: cashReport.id },
          data: {
            totalAmount: { increment: paymentAmount },
            cashAmount: paymentMethod === 'naqd' ? { increment: paymentAmount } : undefined,
            cardAmount: paymentMethod === 'karta' ? { increment: paymentAmount } : undefined,
            bankAmount: paymentMethod === 'hisob' ? { increment: paymentAmount } : undefined,
          }
        });
      }

      return payment;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const paymentId = req.params.id as string;
    const user = (req as any).user;
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    const userName = dbUser?.name || 'Noma\'lum xodim';

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete payment
      await tx.payment.delete({ where: { id: paymentId } });

      // 2. Decrement student paidAmount
      await tx.student.update({
        where: { id: payment.studentId },
        data: {
          paidAmount: { decrement: payment.amount }
        }
      });

      // 3. Decrement from CashReport if it's today's pending
      const paymentDate = new Date(payment.date);
      const startOfDay = new Date(paymentDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(paymentDate);
      endOfDay.setHours(23, 59, 59, 999);

      const cashReport = await tx.cashReport.findFirst({
        where: {
          branchId: payment.branchId,
          date: { gte: startOfDay, lte: endOfDay },
          status: 'pending'
        }
      });

      if (cashReport) {
        await tx.cashReport.update({
          where: { id: cashReport.id },
          data: {
            totalAmount: { decrement: payment.amount },
            cashAmount: payment.method === 'naqd' ? { decrement: payment.amount } : undefined,
            cardAmount: payment.method === 'karta' ? { decrement: payment.amount } : undefined,
            bankAmount: payment.method === 'hisob' ? { decrement: payment.amount } : undefined,
          }
        });
      }

      // 4. Log the deletion
      await tx.activityLog.create({
        data: {
          action: 'DELETED_PAYMENT',
          details: `To'lov o'chirildi: ${payment.amount} so'm (${payment.method})`,
          userId: user.id,
          userName: userName,
          branchId: payment.branchId
        }
      });
    });

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
