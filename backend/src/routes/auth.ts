import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

const router = express.Router();

const generateToken = (id: string, role: string, branchId?: string | null) => {
  return jwt.sign({ id, role, branchId }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d'
  });
};

router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    const user = await prisma.user.findUnique({ where: { login } });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is blocked' });
      }
      
      res.json({
        id: user.id,
        name: user.name,
        login: user.login,
        role: user.role,
        branchId: user.branchId,
        phone: user.phone,
        token: generateToken(user.id, user.role, user.branchId)
      });
    } else {
      res.status(401).json({ message: 'Invalid login or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Seed Initial Superadmin (Run once)
router.post('/seed', async (req, res) => {
  try {
    const exists = await prisma.user.findUnique({ where: { login: 'superadmin' } });
    if (exists) return res.json({ message: 'Already seeded' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123', salt);

    const superadmin = await prisma.user.create({
      data: {
        name: 'Superadmin User',
        login: 'superadmin',
        passwordHash,
        phone: '+998901234567',
        role: 'superadmin',
        isActive: true
      }
    });

    res.json({ message: 'Seeded successfully', superadmin });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
