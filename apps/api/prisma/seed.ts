import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();

  console.log('Creating departments...');
  const engineering = await prisma.department.create({ data: { name: 'Engineering' } });
  const hr = await prisma.department.create({ data: { name: 'Human Resources' } });
  const sales = await prisma.department.create({ data: { name: 'Sales' } });
  await prisma.department.create({ data: { name: 'Marketing' } });

  console.log('Hashing passwords...');
  const defaultPassword = await bcrypt.hash('password123', 10);

  console.log('Creating Super Admin...');
  const superAdmin = await prisma.employee.create({
    data: {
      employeeId: 'EMP-0001',
      name: 'Alice Admin',
      email: 'admin@company.com',
      passwordHash: defaultPassword,
      phone: '1234567890',
      departmentId: engineering.id,
      designation: 'CEO',
      salary: 200000,
      joiningDate: new Date('2020-01-01'),
      status: 'ACTIVE',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Creating HR Managers...');
  const hrManager1 = await prisma.employee.create({
    data: {
      employeeId: 'EMP-0002',
      name: 'Bob HR',
      email: 'hr1@company.com',
      passwordHash: defaultPassword,
      phone: '1234567891',
      departmentId: hr.id,
      designation: 'VP of HR',
      salary: 120000,
      joiningDate: new Date('2021-01-01'),
      status: 'ACTIVE',
      role: 'HR_MANAGER',
      reportingManagerId: superAdmin.id,
    },
  });

  await prisma.employee.create({
    data: {
      employeeId: 'EMP-0003',
      name: 'Carol HR',
      email: 'hr2@company.com',
      passwordHash: defaultPassword,
      phone: '1234567892',
      departmentId: hr.id,
      designation: 'HR Director',
      salary: 110000,
      joiningDate: new Date('2021-06-01'),
      status: 'ACTIVE',
      role: 'HR_MANAGER',
      reportingManagerId: hrManager1.id,
    },
  });

  console.log('Creating Employees and Hierarchy...');

  const engDirector = await prisma.employee.create({
    data: {
      employeeId: 'EMP-0004',
      name: 'David Director',
      email: 'director@company.com',
      passwordHash: defaultPassword,
      phone: '1234567893',
      departmentId: engineering.id,
      designation: 'Director of Engineering',
      salary: 150000,
      joiningDate: new Date('2020-02-01'),
      status: 'ACTIVE',
      role: 'EMPLOYEE',
      reportingManagerId: superAdmin.id,
    },
  });

  const salesDirector = await prisma.employee.create({
    data: {
      employeeId: 'EMP-0005',
      name: 'Eve Sales',
      email: 'sales.dir@company.com',
      passwordHash: defaultPassword,
      phone: '1234567894',
      departmentId: sales.id,
      designation: 'VP of Sales',
      salary: 140000,
      joiningDate: new Date('2020-03-01'),
      status: 'ACTIVE',
      role: 'EMPLOYEE',
      reportingManagerId: superAdmin.id,
    },
  });

  const engManagers: { id: string }[] = [];
  for (let i = 1; i <= 3; i++) {
    const mgr = await prisma.employee.create({
      data: {
        employeeId: `EMP-000${5 + i}`,
        name: `Engineering Manager ${i}`,
        email: `eng.mgr${i}@company.com`,
        passwordHash: defaultPassword,
        phone: `123456780${i}`,
        departmentId: engineering.id,
        designation: 'Engineering Manager',
        salary: 120000,
        joiningDate: new Date(`2021-0${i}-01`),
        status: 'ACTIVE',
        role: 'EMPLOYEE',
        reportingManagerId: engDirector.id,
      },
    });
    engManagers.push(mgr);
  }

  for (let i = 1; i <= 6; i++) {
    await prisma.employee.create({
      data: {
        employeeId: `EMP-001${i + 2}`,
        name: `Software Engineer ${i}`,
        email: `se${i}@company.com`,
        passwordHash: defaultPassword,
        phone: `123456710${i}`,
        departmentId: engineering.id,
        designation: 'Software Engineer',
        salary: 90000,
        joiningDate: new Date(`2022-0${(i % 12) + 1}-01`),
        status: 'ACTIVE',
        role: 'EMPLOYEE',
        reportingManagerId: engManagers[i % 3]!.id,
      },
    });
  }

  for (let i = 1; i <= 3; i++) {
    await prisma.employee.create({
      data: {
        employeeId: `EMP-002${i}`,
        name: `Sales Executive ${i}`,
        email: `sales${i}@company.com`,
        passwordHash: defaultPassword,
        phone: `123456720${i}`,
        departmentId: sales.id,
        designation: 'Sales Executive',
        salary: 70000,
        joiningDate: new Date(`2022-0${i}-15`),
        status: 'ACTIVE',
        role: 'EMPLOYEE',
        reportingManagerId: salesDirector.id,
      },
    });
  }

  console.log('Seed completed successfully!');
  console.log('--- TEST CREDENTIALS ---');
  console.log('Super Admin:  admin@company.com / password123');
  console.log('HR Manager:   hr1@company.com   / password123');
  console.log('HR Manager 2: hr2@company.com   / password123');
  console.log('Director:     director@company.com / password123');
  console.log('Engineer:     se1@company.com   / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
