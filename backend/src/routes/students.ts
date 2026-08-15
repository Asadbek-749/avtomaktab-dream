import express from 'express';
import { prisma } from '../prisma';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', async (req: any, res: any) => {
  try {
    const user = req.user;
    const whereClause = user.role === 'superadmin' ? {} : { branchId: user.branchId };
    const students = await prisma.student.findMany({ 
      where: whereClause,
      include: { group: true }
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authorize('superadmin', 'admin'), async (req, res) => {
  try {
    console.log('Received student data:', req.body);
    console.log('User ID:', (req as any).user.id);

    // Extract only the fields that exist in Prisma schema
    const {
      firstName,
      lastName,
      phone,
      groupId,
      branchId,
      instructorId,
      coursePrice,
      paidAmount,
      status,
      providedDocuments,
      drivingHoursRequired,
      drivingHoursDone,
      transmissionPreference,
      pinfl,
      passport,
      additionalPhone,
      practiceGroupId
    } = req.body;

    const studentData: any = {
      firstName,
      lastName,
      phone,
      groupId,
      branchId,
      coursePrice: parseFloat(coursePrice),
      paidAmount: parseFloat(paidAmount || 0),
      status: status || 'active',
      drivingHoursRequired: parseFloat(drivingHoursRequired || 20),
      drivingHoursDone: parseFloat(drivingHoursDone || 0),
      createdBy: (req as any).user.id
    };

    // Add optional fields only if they exist
    if (instructorId) {
      studentData.instructorId = instructorId;
    }
    if (transmissionPreference) {
      studentData.transmissionPreference = transmissionPreference;
    }
    if (providedDocuments) {
      studentData.providedDocuments = providedDocuments;
    }
    if (practiceGroupId !== undefined) {
      studentData.practiceGroupId = practiceGroupId;
    }
    if (pinfl) {
      studentData.pinfl = pinfl;
    }
    if (passport) {
      studentData.passport = passport;
    }
    if (additionalPhone) {
      studentData.additionalPhone = additionalPhone;
    }

    const student = await prisma.student.create({
      data: studentData
    });

    console.log('Student created successfully:', student);
    res.status(201).json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({
      message: 'Server error',
      error: (error as any).message,
      details: (error as any).stack
    });
  }
});

router.put('/:id', authorize('superadmin', 'admin'), async (req, res) => {
  try {
    console.log('Updating student:', req.params.id);
    console.log('Update data:', req.body);

    // Extract only the fields that exist in Prisma schema
    const {
      firstName,
      lastName,
      phone,
      groupId,
      branchId,
      instructorId,
      coursePrice,
      paidAmount,
      status,
      providedDocuments,
      drivingHoursRequired,
      drivingHoursDone,
      transmissionPreference,
      pinfl,
      passport,
      additionalPhone,
      practiceGroupId,
      practiceStatus
    } = req.body;

    const updateData: any = {};

    // Only add fields that are defined
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (groupId !== undefined) updateData.groupId = groupId;
    if (branchId !== undefined) updateData.branchId = branchId;
    if (instructorId !== undefined) updateData.instructorId = instructorId;
    if (coursePrice !== undefined) updateData.coursePrice = parseFloat(coursePrice);
    if (paidAmount !== undefined) updateData.paidAmount = parseFloat(paidAmount);
    if (status !== undefined) updateData.status = status;
    if (providedDocuments !== undefined) updateData.providedDocuments = providedDocuments;
    if (drivingHoursRequired !== undefined) updateData.drivingHoursRequired = parseFloat(drivingHoursRequired);
    if (drivingHoursDone !== undefined) updateData.drivingHoursDone = parseFloat(drivingHoursDone);
    if (transmissionPreference !== undefined) updateData.transmissionPreference = transmissionPreference;
    if (pinfl !== undefined) updateData.pinfl = pinfl;
    if (passport !== undefined) updateData.passport = passport;
    if (additionalPhone !== undefined) updateData.additionalPhone = additionalPhone;
    if (practiceGroupId !== undefined) updateData.practiceGroupId = practiceGroupId;
    if (practiceStatus !== undefined) updateData.practiceStatus = practiceStatus;

    const student = await prisma.student.update({
      where: { id: req.params.id as string },
      data: updateData
    });

    console.log('Student updated successfully:', student);
    res.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({
      message: 'Server error',
      error: (error as any).message
    });
  }
});
router.delete('/:id', authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const studentId = req.params.id as string;
    await prisma.student.delete({
      where: { id: studentId }
    });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
