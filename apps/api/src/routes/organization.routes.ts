import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/organization/tree - Full org hierarchy as nested JSON
router.get('/tree', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const allEmployees = await prisma.employee.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        employeeId: true,
        name: true,
        designation: true,
        role: true,
        status: true,
        departmentId: true,
        department: { select: { name: true } },
        reportingManagerId: true,
        profileImageUrl: true,
      },
    });

    // Build nested tree from flat list
    const employeeMap = new Map<string, any>();
    allEmployees.forEach((emp) => {
      employeeMap.set(emp.id, { ...emp, children: [] });
    });

    const roots: any[] = [];
    employeeMap.forEach((emp) => {
      if (emp.reportingManagerId && employeeMap.has(emp.reportingManagerId)) {
        employeeMap.get(emp.reportingManagerId).children.push(emp);
      } else {
        roots.push(emp);
      }
    });

    // For EMPLOYEE role, return only their own branch
    if (req.user!.role === 'EMPLOYEE') {
      const findBranch = (nodes: any[], targetId: string): any | null => {
        for (const node of nodes) {
          if (node.id === targetId) return node;
          const found = findBranch(node.children, targetId);
          if (found) return found;
        }
        return null;
      };
      const branch = findBranch(roots, req.user!.id);
      return res.json(branch ? [branch] : []);
    }

    res.json(roots);
  } catch (error) {
    console.error('Org tree error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/organization/:id/manager - Assign/change reporting manager
router.patch('/:id/manager', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const { id } = req.params;
    const { reportingManagerId } = req.body;

    if (!['SUPER_ADMIN', 'HR_MANAGER'].includes(req.user!.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (id === reportingManagerId) {
      return res.status(400).json({ error: 'An employee cannot be their own manager' });
    }

    // Circular reference check: walk up from proposed manager to root
    if (reportingManagerId) {
      let current = reportingManagerId;
      while (current) {
        if (current === id) {
          return res.status(400).json({
            error: 'Circular hierarchy detected: this assignment would create a reporting cycle',
          });
        }
        const manager = await prisma.employee.findUnique({
          where: { id: current },
          select: { reportingManagerId: true },
        });
        current = manager?.reportingManagerId ?? null;
      }
    }

    const updated = await prisma.employee.update({
      where: { id: id as string },
      data: { reportingManagerId: reportingManagerId ?? null },
      select: { id: true, name: true, reportingManagerId: true },
    });

    res.json(updated);
  } catch (error) {
    console.error('Manager assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/organization/:id/reportees - Direct reports of an employee
router.get('/:id/reportees', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const reportees = await prisma.employee.findMany({
      where: {
        reportingManagerId: req.params.id as string,
        deletedAt: null,
      },
      select: {
        id: true, employeeId: true, name: true, email: true,
        designation: true, role: true, status: true,
        department: { select: { name: true } },
      },
    });
    res.json(reportees);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
