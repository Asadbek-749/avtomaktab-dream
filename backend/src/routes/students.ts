import express from 'express';
import { prisma } from '../prisma';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const students = await prisma.student.findMany();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const student = await prisma.student.create({
      data: { ...req.body, createdBy: (req as any).user.id }
    });
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const student = await prisma.student.update({
      where: { id: req.params.id as string },
      data: req.body
    });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
