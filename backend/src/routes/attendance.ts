import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get attendances
router.get('/', protect, async (req, res) => {
  try {
    const { groupId } = req.query;
    const filter: any = {};
    if (groupId) {
      filter.groupId = String(groupId);
    }
    
    // For now, return based on group filter
    const attendances = await prisma.attendance.findMany({
      where: filter,
      include: {
        records: true,
        teacher: {
          select: { name: true, id: true }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.json(attendances);
  } catch (error) {
    console.error('Error fetching attendances:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add or update attendance
router.post('/', protect, async (req, res) => {
  try {
    const { groupId, date, records, teacherId } = req.body;

    if (!groupId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if attendance already exists for this group and date
    let attendance = await prisma.attendance.findUnique({
      where: {
        groupId_date: {
          groupId,
          date
        }
      }
    });

    if (attendance) {
      // Update existing
      // Delete old records and create new ones
      await prisma.attendanceRecord.deleteMany({
        where: { attendanceId: attendance.id }
      });

      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          records: {
            create: records.map((r: any) => ({
              studentId: r.studentId,
              present: r.present
            }))
          }
        },
        include: { records: true }
      });
    } else {
      // Create new
      attendance = await prisma.attendance.create({
        data: {
          groupId,
          date,
          teacherId,
          records: {
            create: records.map((r: any) => ({
              studentId: r.studentId,
              present: r.present
            }))
          }
        },
        include: { records: true }
      });
    }

    res.status(201).json(attendance);
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
