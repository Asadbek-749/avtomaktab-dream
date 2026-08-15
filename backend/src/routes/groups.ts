import express from 'express';
import { prisma } from '../prisma';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', async (req: any, res: any) => {
  try {
    const user = req.user;
    const whereClause = user.role === 'superadmin' ? {} : { branchId: user.branchId };
    const groups = await prisma.group.findMany({ where: whereClause });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const group = await prisma.group.create({ data: req.body });
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const group = await prisma.group.update({
      where: { id: req.params.id as string },
      data: req.body
    });
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
