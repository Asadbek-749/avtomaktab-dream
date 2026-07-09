import express from 'express';
import { prisma } from '../prisma';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const branches = await prisma.branch.findMany();
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authorize('superadmin'), async (req, res) => {
  try {
    const branch = await prisma.branch.create({ data: req.body });
    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authorize('superadmin'), async (req, res) => {
  try {
    await prisma.branch.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Branch removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
