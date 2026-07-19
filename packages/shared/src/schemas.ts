import { z } from 'zod';

export const RoleEnum = z.enum(['SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE']);
export const StatusEnum = z.enum(['ACTIVE', 'INACTIVE']);

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const EmployeeCreateSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 characters'),
  departmentId: z.string().uuid('Invalid department ID'),
  designation: z.string().min(2, 'Designation is required'),
  salary: z.number().positive('Salary must be greater than 0'),
  joiningDate: z.string().refine(v => !isNaN(Date.parse(v)), { message: 'Invalid joining date' }),
  status: StatusEnum.optional().default('ACTIVE'),
  role: RoleEnum.optional().default('EMPLOYEE'),
  reportingManagerId: z.string().uuid('Invalid manager ID').nullable().optional(),
  profileImageUrl: z.string().url('Invalid URL').nullable().optional(),
});

export const EmployeeUpdateSchema = EmployeeCreateSchema.partial().omit({ password: true });

export const DepartmentCreateSchema = z.object({
  name: z.string().min(2, 'Department name is required'),
});
