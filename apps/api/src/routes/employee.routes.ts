import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { EmployeeCreateSchema, EmployeeUpdateSchema } from 'shared';

const router = Router();
const prisma = new PrismaClient();

// GET /api/employees - Paginated, filtered, sorted
router.get('/', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const { 
      page = '1', limit = '10', 
      search = '', department, role, status,
      sortBy = 'name', order = 'asc' 
    } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Record<string, any> = {
      deletedAt: null,
    };

    if (req.user!.role === 'EMPLOYEE') {
      where.id = req.user!.id;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { employeeId: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (department) where.departmentId = department as string;
    if (role) where.role = role as any;
    if (status) where.status = status as any;

    const orderDirection = (order === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc';
    const orderBy: Record<string, 'asc' | 'desc'> =
      sortBy === 'joiningDate'
        ? { joiningDate: orderDirection }
        : { name: orderDirection };

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy,
        skip,
        take: limitNumber,
        select: {
          id: true, employeeId: true, name: true, email: true, 
          phone: true, designation: true, status: true, role: true, 
          departmentId: true, department: { select: { name: true } }
        }
      }),
      prisma.employee.count({ where })
    ]);

    res.json({
      data: employees,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Fetch employees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/employees - Super Admin, HR Manager only
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'HR_MANAGER']), async (req: AuthRequest, res: any) => {
  try {
    const parsed = EmployeeCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }

    // Check if email exists
    const existing = await prisma.employee.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Auto-generate employeeId
    const count = await prisma.employee.count();
    const employeeId = `EMP-${String(count + 1).padStart(4, '0')}`;

    // Hash password — destructure it OUT so it's never sent to Prisma as 'password'
    const { password, reportingManagerId, ...rest } = parsed.data;
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);

    const employee = await prisma.employee.create({
      data: {
        ...rest,
        passwordHash,
        employeeId,
        joiningDate: new Date(rest.joiningDate),
        ...(reportingManagerId ? { reportingManagerId } : {}),
      },
      select: {
        id: true, employeeId: true, name: true, email: true, role: true
      }
    });

    res.status(201).json(employee);
  } catch (error: any) {
    console.error('Create employee error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

// GET /api/employees/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id as string, deletedAt: null },
      include: {
        department: { select: { name: true } },
        reportingManager: { select: { id: true, name: true } },
      }
    });

    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    // RBAC: Employee can only view their own profile or others (spec: Employee can't view others, wait: spec says View all employees: Employee -> ❌ (own only))
    // Ah, spec: View all employees: Employee -> ❌ (own only). So employee can only view their own data.
    if (req.user!.role === 'EMPLOYEE' && req.user!.id !== employee.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Exclude password
    const { passwordHash, ...safeEmployee } = employee;
    res.json(safeEmployee);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/employees/:id
router.put('/:id', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const employeeId = req.params.id;
    const isSelf = req.user!.id === employeeId;
    const isHR = req.user!.role === 'HR_MANAGER';
    const isAdmin = req.user!.role === 'SUPER_ADMIN';

    if (!isSelf && !isHR && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const parsed = EmployeeUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }

    let updateData = { ...parsed.data } as any;
    
    // RBAC restrictions
    if (isSelf && !isHR && !isAdmin) {
      // Employees can only edit phone and profile image
      updateData = {};
      if (parsed.data.phone) updateData.phone = parsed.data.phone;
      if (parsed.data.profileImageUrl) updateData.profileImageUrl = parsed.data.profileImageUrl;
    }

    if (isHR && !isAdmin) {
      // HR can edit full fields except changing role to Super Admin
      if (updateData.role === 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'HR cannot promote to SUPER_ADMIN' });
      }
    }

    if (updateData.joiningDate) {
      updateData.joiningDate = new Date(updateData.joiningDate);
    }

    const employee = await prisma.employee.update({
      where: { id: employeeId as string },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true }
    });

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/employees/:id - Super Admin only
router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN']), async (req: AuthRequest, res: any) => {
  try {
    await prisma.employee.update({
      where: { id: req.params.id as string },
      data: { deletedAt: new Date(), status: 'INACTIVE' }
    });
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
