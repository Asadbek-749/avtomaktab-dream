const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('Test ma\'lumotlarini kiritish boshlandi...');
  
  const passwordHash = await bcrypt.hash('123456', 10);
  
  // Create 2 branches
  const branches = [];
  for (let i = 1; i <= 2; i++) {
    const branch = await prisma.branch.create({
      data: {
        name: `Test Filial ${i}`,
        address: `Toshkent, Tuman ${i}`,
      }
    });
    branches.push(branch);
  }

  for (let b of branches) {
    // Create admin
    const admin = await prisma.user.create({
      data: {
        name: `${b.name} Admin`,
        login: `admin_${b.id.substring(0, 4)}`,
        phone: `+99890${Math.floor(1000000 + Math.random() * 9000000)}`,
        passwordHash,
        role: 'admin',
        branchId: b.id
      }
    });

    // Create 2 teachers
    const teachers = [];
    for (let i = 1; i <= 2; i++) {
      const teacher = await prisma.user.create({
        data: {
          name: `O'qituvchi ${b.name.split(' ')[2]} - ${i}`,
          login: `teacher_${b.id.substring(0, 4)}_${i}`,
          phone: `+99890${Math.floor(1000000 + Math.random() * 9000000)}`,
          passwordHash,
          role: 'teacher',
          branchId: b.id
        }
      });
      teachers.push(teacher);
    }

    // Create 3 instructors
    const instructors = [];
    for (let i = 1; i <= 3; i++) {
      const instructor = await prisma.user.create({
        data: {
          name: `Instruktor ${b.name.split(' ')[2]} - ${i}`,
          login: `instructor_${b.id.substring(0, 4)}_${i}`,
          phone: `+99890${Math.floor(1000000 + Math.random() * 9000000)}`,
          passwordHash,
          role: 'instructor',
          branchId: b.id,
          carModel: 'Cobalt',
          carNumber: `01 A ${100 + i} AA`,
          transmission: i % 2 === 0 ? 'auto' : 'manual',
          studentPrice: 200000
        }
      });
      instructors.push(instructor);
    }

    // Create 4 groups
    for (let i = 1; i <= 4; i++) {
      const group = await prisma.group.create({
        data: {
          name: `Guruh ${i} (${b.name})`,
          teacherId: teachers[i % 2].id,
          branchId: b.id,
          schedule: JSON.stringify([{ day: 'mon', startTime: '09:00', type: 'theory' }])
        }
      });

      // Create 7-8 students per group
      const numStudents = Math.floor(Math.random() * 2) + 7;
      for (let j = 1; j <= numStudents; j++) {
        const coursePrice = 1500000;
        const student = await prisma.student.create({
          data: {
            firstName: `Talaba ${j}`,
            lastName: `Familiya ${b.name.split(' ')[2]}`,
            phone: `+99890${Math.floor(1000000 + Math.random() * 9000000)}`,
            groupId: group.id,
            branchId: b.id,
            coursePrice,
            paidAmount: 0,
            status: 'active',
            drivingHoursRequired: 20,
            drivingHoursDone: 0,
            createdBy: admin.id
          }
        });

        // Add 1-2 payments for some students
        if (Math.random() > 0.3) {
          const amount = 500000;
          await prisma.payment.create({
            data: {
              amount,
              date: new Date(),
              note: 'Boshlang\'ich to\'lov',
              studentId: student.id,
              branchId: b.id,
              addedBy: admin.id
            }
          });
          
          await prisma.student.update({
            where: { id: student.id },
            data: { paidAmount: amount }
          });
        }
      }
    }
  }

  console.log('Ma\'lumotlar muvaffaqiyatli kiritildi!');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
