import { z } from 'zod';
import {
  LoginSchema,
  EmployeeCreateSchema,
  EmployeeUpdateSchema,
  DepartmentCreateSchema,
  RoleEnum,
  StatusEnum,
} from './schemas';

export type LoginType = z.infer<typeof LoginSchema>;
export type EmployeeCreateType = z.infer<typeof EmployeeCreateSchema>;
export type EmployeeUpdateType = z.infer<typeof EmployeeUpdateSchema>;
export type DepartmentCreateType = z.infer<typeof DepartmentCreateSchema>;

export type Role = z.infer<typeof RoleEnum>;
export type Status = z.infer<typeof StatusEnum>;

export interface EmployeeResponse {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  department?: {
    id: string;
    name: string;
  };
  designation: string;
  salary: number | string;
  joiningDate: string | Date;
  status: Status;
  role: Role;
  reportingManagerId: string | null;
  profileImageUrl: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}
