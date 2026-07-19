import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();
const prisma = new PrismaClient();

// GET /api/dashboard/stats
router.get('/stats', authenticate, requireRole(['SUPER_ADMIN', 'HR_MANAGER']), async (req: AuthRequest, res: any) => {
  try {
    const [total, active, inactive, departmentCount, departments] = await Promise.all([
      prisma.employee.count({ where: { deletedAt: null } }),
      prisma.employee.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      prisma.employee.count({ where: { deletedAt: null, status: 'INACTIVE' } }),
      prisma.department.count(),
      prisma.department.findMany({
        select: {
          name: true,
          _count: { select: { employees: { where: { deletedAt: null, status: 'ACTIVE' } } } },
        },
      }),
    ]);

    const employeesByDepartment = departments.map((d) => ({
      department: d.name,
      count: d._count.employees,
    }));

    res.json({
      total,
      active,
      inactive,
      departmentCount,
      employeesByDepartment,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
