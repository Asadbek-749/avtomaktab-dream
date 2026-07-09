import express from 'express';
import { prisma } from '../prisma';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authorize('superadmin', 'admin'), async (req, res) => {
  try {
    // Start a transaction: Create payment and update student paidAmount
    const [payment, student] = await prisma.$transaction([
      prisma.payment.create({
        data: { ...req.body, addedBy: (req as any).user.id }
      }),
      prisma.student.update({
        where: { id: req.body.studentId },
        data: {
          paidAmount: {
            increment: req.body.amount
          }
        }
      })
    ]);

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
