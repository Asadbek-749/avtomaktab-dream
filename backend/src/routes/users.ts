import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, login: true, phone: true, role: true, branchId: true, isActive: true, 
        carModel: true, carNumber: true, transmission: true,
        createdAt: true, updatedAt: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authorize('superadmin'), async (req, res) => {
  try {
    const { name, login, phone, role, branchId, password, carModel, carNumber, transmission } = req.body;
    
    const exists = await prisma.user.findUnique({ where: { login } });
    if (exists) return res.status(400).json({ message: 'Login already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name, login, phone, role, branchId: branchId || null, passwordHash, isActive: true,
        carModel, carNumber, transmission
      },
      select: {
        id: true, name: true, login: true, phone: true, role: true, branchId: true, isActive: true, 
        carModel: true, carNumber: true, transmission: true,
        createdAt: true, updatedAt: true
      }
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', authorize('superadmin'), async (req, res) => {
  try {
    const { name, login, phone, role, branchId, password, isActive, carModel, carNumber, transmission } = req.body;
    
    let updateData: any = { name, login, phone, role, branchId, isActive, carModel, carNumber, transmission };
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: updateData,
      select: {
        id: true, name: true, login: true, phone: true, role: true, branchId: true, isActive: true, 
        carModel: true, carNumber: true, transmission: true,
        createdAt: true, updatedAt: true
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authorize('superadmin'), async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
