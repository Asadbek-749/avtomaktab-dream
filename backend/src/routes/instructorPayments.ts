import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get overall summary for all instructors
router.get('/summary', protect, async (req: AuthRequest, res: Response) => {
  try {
    const branchId = req.user?.branchId;

    const instructors = await prisma.user.findMany({
      where: {
        role: 'instructor',
        ...(branchId ? { branchId } : {})
      },
      select: {
        id: true,
        name: true,
        studentPrice: true,
        branchId: true
      }
    });

    const students = await prisma.student.findMany({
      where: {
        instructorId: { in: instructors.map(i => i.id) },
        practiceGroupId: { not: null }
      },
      select: { instructorId: true }
    });

    const payments = await prisma.instructorPayment.findMany({
      where: {
        instructorId: { in: instructors.map(i => i.id) },
        type: 'avans'
      },
      select: { instructorId: true, amount: true }
    });

    const summary = instructors.map(instructor => {
      const instStudents = students.filter(s => s.instructorId === instructor.id);
      const instPayments = payments.filter(p => p.instructorId === instructor.id);
      
      const pricePerStudent = Number(instructor.studentPrice) || 200000;
      const totalEarned = instStudents.length * pricePerStudent;
      const totalAdvances = instPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const balance = totalEarned - totalAdvances;

      return {
        instructorId: instructor.id,
        name: instructor.name,
        branchId: instructor.branchId,
        studentCount: instStudents.length,
        pricePerStudent,
        totalEarned,
        totalAdvances,
        balance
      };
    });

    res.json(summary);
  } catch (error) {
    console.error('Error fetching instructor summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get instructor payments for a specific instructor
router.get('/instructor/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const branchId = req.user?.branchId;

    const payments = await prisma.instructorPayment.findMany({
      where: {
        instructorId: id,
        ...(branchId ? { branchId } : {}),
      },
      include: {
        adder: { select: { id: true, name: true, login: true, role: true } },
      },
      orderBy: { date: 'desc' },
    });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching instructor payments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add a new instructor payment (e.g. avans or salary)
router.post('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { instructorId, amount, type, date, note, branchId } = req.body;
    const userBranchId = req.user?.branchId;
    const addedBy = req.user?.id;

    if (!addedBy) return res.status(401).json({ message: 'Unauthorized' });

    const targetBranchId = userBranchId || branchId;
    if (!targetBranchId) {
      return res.status(400).json({ message: 'Branch ID is required for superadmin' });
    }

    const payment = await prisma.instructorPayment.create({
      data: {
        amount,
        type,
        date: new Date(date),
        note,
        instructorId,
        branchId: targetBranchId,
        addedBy,
      },
      include: {
        adder: { select: { id: true, name: true, login: true, role: true } },
      },
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error adding instructor payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete an instructor payment
router.delete('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const branchId = req.user?.branchId;

    const payment = await prisma.instructorPayment.findUnique({ where: { id } });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    if (branchId && payment.branchId !== branchId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.instructorPayment.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting instructor payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
