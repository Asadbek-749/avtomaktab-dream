import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', async (req: any, res: any) => {
  try {
    const user = req.user;
    const whereClause = user.role === 'superadmin' ? {} : { branchId: user.branchId };
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true, name: true, login: true, phone: true, role: true, branchId: true, isActive: true, 
        carModel: true, carNumber: true, transmission: true, studentPrice: true,
        createdAt: true, updatedAt: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authorize('superadmin', 'admin'), async (req: any, res: any) => {
  try {
    const { name, login, phone, role, branchId, password, carModel, carNumber, transmission, studentPrice } = req.body;
    
    const currentUser = req.user;
    
    // Admin checking
    if (currentUser.role === 'admin') {
      if (role === 'superadmin' || role === 'admin') {
        return res.status(403).json({ message: 'Admins cannot create superadmins or other admins' });
      }
      if (branchId !== currentUser.branchId) {
        return res.status(403).json({ message: 'Admins can only create users in their own branch' });
      }
    }

    const exists = await prisma.user.findUnique({ where: { login } });
    if (exists) return res.status(400).json({ message: 'Login already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name, login, phone, role, branchId: branchId || null, passwordHash, isActive: true,
        carModel, carNumber, transmission,
        studentPrice: studentPrice ? parseFloat(studentPrice) : 200000
      },
      select: {
        id: true, name: true, login: true, phone: true, role: true, branchId: true, isActive: true, 
        carModel: true, carNumber: true, transmission: true, studentPrice: true,
        createdAt: true, updatedAt: true
      }
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', authorize('superadmin', 'admin'), async (req: any, res: any) => {
  try {
    const { name, login, phone, role, branchId, password, isActive, carModel, carNumber, transmission, studentPrice } = req.body;
    
    const currentUser = req.user;

    // Fetch existing user to check permissions
    const existingUser = await prisma.user.findUnique({ where: { id: req.params.id as string } });
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isSelfEdit = currentUser.id === existingUser.id;

    if (currentUser.role === 'admin' && !isSelfEdit) {
      if (existingUser.role === 'superadmin' || existingUser.role === 'admin') {
        return res.status(403).json({ message: 'Admins cannot edit superadmins or other admins' });
      }
      if (existingUser.branchId !== currentUser.branchId) {
        return res.status(403).json({ message: 'You can only edit users in your own branch' });
      }
      if (role === 'superadmin' || role === 'admin') {
        return res.status(403).json({ message: 'Admins cannot change role to superadmin or admin' });
      }
      if (branchId && branchId !== currentUser.branchId) {
        return res.status(403).json({ message: 'Admins cannot change branch assignment to another branch' });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (login !== undefined) updateData.login = login;
    if (phone !== undefined) updateData.phone = phone;
    // Don't allow users to change their own role or branch directly, unless they are superadmin
    if (role !== undefined && (!isSelfEdit || currentUser.role === 'superadmin')) updateData.role = role;
    if (branchId !== undefined && (!isSelfEdit || currentUser.role === 'superadmin')) updateData.branchId = branchId || null;
    if (isActive !== undefined && (!isSelfEdit || currentUser.role === 'superadmin')) updateData.isActive = isActive;
    if (carModel !== undefined) updateData.carModel = carModel;
    if (carNumber !== undefined) updateData.carNumber = carNumber;
    if (transmission !== undefined) updateData.transmission = transmission;
    if (studentPrice !== undefined) updateData.studentPrice = studentPrice ? parseFloat(studentPrice as string) : null;
    
    if (password) {
      // If changing password, optionally require currentPassword
      const { currentPassword } = req.body;
      if (isSelfEdit && currentPassword) {
         const isMatch = await bcrypt.compare(currentPassword, existingUser.passwordHash);
         if (!isMatch) {
            return res.status(400).json({ message: 'Eski parol noto\'g\'ri kiritildi' });
         }
      }
      
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: updateData,
      select: {
        id: true, name: true, login: true, phone: true, role: true, branchId: true, isActive: true, 
        carModel: true, carNumber: true, transmission: true, studentPrice: true,
        createdAt: true, updatedAt: true
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authorize('superadmin', 'admin'), async (req: any, res: any) => {
  try {
    const currentUser = req.user;
    const existingUser = await prisma.user.findUnique({ where: { id: req.params.id as string } });
    
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser.role === 'admin') {
      if (existingUser.role === 'superadmin' || existingUser.role === 'admin') {
        return res.status(403).json({ message: 'Admins cannot delete superadmins or other admins' });
      }
      if (existingUser.branchId !== currentUser.branchId) {
        return res.status(403).json({ message: 'You can only delete users in your own branch' });
      }
    }

    await prisma.user.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'User removed' });
  } catch (error: any) {
    console.error("DELETE USER ERROR:", error);
    if (error?.code === 'P2003' || (error?.message && (error.message.includes('23001') || error.message.includes('RESTRICT') || error.message.includes('внешнего ключа')))) {
      return res.status(400).json({ message: "Ushbu xodimga tegishli ma'lumotlar (guruhlar, to'lovlar yozuvlari) mavjud bo'lganligi sababli o'chirib bo'lmaydi. Iltimos, xodimni bloklang (faolsizlantiring)." });
    }
    res.status(500).json({ message: error?.message || 'Server error' });
  }
});

export default router;
