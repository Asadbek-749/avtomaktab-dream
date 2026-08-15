import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authorize, protect } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.use(protect);

// Get practice groups for a specific branch (or all for superadmin)
router.get('/', authorize('superadmin', 'admin', 'instructor'), async (req, res) => {
  try {
    const { branchId, instructorId } = req.query;
    const user = (req as any).user;

    const whereClause: any = {};
    
    if (user.role !== 'superadmin') {
      whereClause.branchId = user.branchId;
    } else if (branchId) {
      whereClause.branchId = branchId as string;
    }

    if (instructorId) {
      whereClause.instructorId = instructorId as string;
    }
    
    if (user.role === 'instructor') {
      whereClause.instructorId = user.id;
    }

    const practiceGroups = await prisma.practiceGroup.findMany({
      where: whereClause,
      include: {
        instructor: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(practiceGroups);
  } catch (error) {
    console.error('Error fetching practice groups:', error);
    res.status(500).json({ error: 'Failed to fetch practice groups' });
  }
});

// Create practice group
router.post('/', authorize('superadmin', 'admin'), async (req, res) => {
  try {
    let { name, instructorId, branchId } = req.body;

    if (!branchId && instructorId) {
      const instructor = await prisma.user.findUnique({ where: { id: instructorId } });
      branchId = instructor?.branchId;
      if (!branchId) {
        const firstBranch = await prisma.branch.findFirst();
        branchId = firstBranch?.id;
      }
    }
    
    if (!name || !instructorId || !branchId) {
      console.log('Failed validation:', { name, instructorId, branchId });
      return res.status(400).json({ error: 'Name, instructorId, and branchId are required' });
    }

    const group = await prisma.practiceGroup.create({
      data: {
        name,
        instructorId,
        branchId
      }
    });

    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating practice group:', error);
    res.status(500).json({ error: 'Failed to create practice group' });
  }
});

// Update practice group
router.put('/:id', authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { name, status } = req.body;
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
    }

    const group = await prisma.practiceGroup.update({
      where: { id: req.params.id as string },
      data: updateData
    });

    res.json(group);
  } catch (error) {
    console.error('Error updating practice group:', error);
    res.status(500).json({ error: 'Failed to update practice group' });
  }
});

// Delete practice group
router.delete('/:id', authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const groupId = req.params.id as string;
    
    // Make sure to remove students from this group before deleting
    await prisma.student.updateMany({
      where: { practiceGroupId: groupId },
      data: { practiceGroupId: null, practiceStatus: 'not_started' }
    });

    await prisma.practiceGroup.delete({
      where: { id: groupId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting practice group:', error);
    res.status(500).json({ error: 'Failed to delete practice group' });
  }
});

export default router;
