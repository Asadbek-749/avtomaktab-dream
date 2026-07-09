import express from 'express';
import { prisma } from '../prisma';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const log = await prisma.activityLog.create({
      data: req.body
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
