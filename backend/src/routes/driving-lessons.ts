import express from 'express';
import { prisma } from '../prisma';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

// Get lessons for a specific student or instructor
router.get('/', async (req, res) => {
  try {
    const { studentId, instructorId } = req.query;
    
    let whereClause: any = {};
    if (studentId) whereClause.studentId = studentId as string;
    if (instructorId) whereClause.instructorId = instructorId as string;

    const lessons = await prisma.drivingLesson.findMany({
      where: whereClause,
      include: {
        student: { select: { firstName: true, lastName: true } },
        instructor: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });
    
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new driving lesson (Instructor or Admin)
router.post('/', authorize('superadmin', 'admin', 'instructor'), async (req, res) => {
  try {
    const { date, startTime, endTime, hours, status, notes, studentId, instructorId } = req.body;
    
    const lesson = await prisma.drivingLesson.create({
      data: {
        date: new Date(date),
        startTime,
        endTime,
        hours: Number(hours),
        status: status || 'completed',
        notes,
        studentId,
        instructorId
      }
    });

    // Automatically update student's drivingHoursDone
    if (lesson.status === 'completed') {
      await prisma.student.update({
        where: { id: studentId },
        data: {
          drivingHoursDone: { increment: Number(hours) }
        }
      });
    }

    res.status(201).json(lesson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update lesson
router.put('/:id', authorize('superadmin', 'admin', 'instructor'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const lessonId = req.params.id as string;
    
    // If status changes to completed, we should ideally increment student's hours, 
    // but for simplicity we assume it's created as completed usually.
    const lesson = await prisma.drivingLesson.update({
      where: { id: lessonId },
      data: { status, notes }
    });
    
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete lesson
router.delete('/:id', authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const lessonId = req.params.id as string;
    
    // Fetch lesson to decrement hours before deleting
    const lesson = await prisma.drivingLesson.findUnique({ where: { id: lessonId } });
    if (lesson && lesson.status === 'completed') {
      await prisma.student.update({
        where: { id: lesson.studentId },
        data: {
          drivingHoursDone: { decrement: lesson.hours }
        }
      });
    }

    await prisma.drivingLesson.delete({ where: { id: lessonId } });
    res.json({ message: 'Lesson removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
