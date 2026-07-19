'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API = 'http://localhost:3001';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [userRole, setUserRole] = useState('');
  const router = useRouter();

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const q = new URLSearchParams({ page: page.toString(), limit: '10', search: debouncedSearch, department, role, status, sortBy, order });
      const res = await fetch(`${API}/api/employees?${q}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      setEmployees(data.data || []);
      setMeta(data.meta || {});
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [page, debouncedSearch, department, role, status, sortBy, order, router]);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUserRole(JSON.parse(u).role);
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const toggleOrder = () => setOrder(o => o === 'asc' ? 'desc' : 'asc');

  const roleBadge: Record<string,string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-700',
    HR_MANAGER: 'bg-purple-100 text-purple-700',
    EMPLOYEE: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <span className="text-2xl font-bold text-blue-600">EMS</span>
          <div className="flex gap-6 text-sm font-medium">
            <a href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">Dashboard</a>
            <a href="/employees" className="text-blue-600 border-b-2 border-blue-600 pb-1">Employees</a>
            <a href="/organization" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">Org Chart</a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Employees</h1>
            <p className="text-gray-500 text-sm mt-1">{meta.total ?? '–'} total employees</p>
          </div>
          {['SUPER_ADMIN','HR_MANAGER'].includes(userRole) && (
            <button onClick={() => router.push('/employees/new')} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition shadow-sm">+ Add Employee</button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-4 mb-6 flex flex-wrap gap-3">
          <input
            type="text" placeholder="🔍 Search name, email, ID…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl flex-1 min-w-[200px] bg-gray-50 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white text-sm">
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="HR_MANAGER">HR Manager</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white text-sm">
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white text-sm">
            <option value="name">Sort: Name</option>
            <option value="joiningDate">Sort: Joining Date</option>
          </select>
          <button onClick={toggleOrder} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition">
            {order === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading employees…</td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No employees found</td></tr>
              ) : employees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                        {emp.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{emp.name}</p>
                        <p className="text-xs text-gray-400">{emp.employeeId} · {emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{emp.department?.name ?? '–'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${roleBadge[emp.role] || ''}`}>{emp.role?.replace('_',' ')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${emp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{emp.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => router.push(`/employees/${emp.id}`)} className="text-blue-600 hover:underline text-sm font-medium">View / Edit →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-6">
            <button disabled={page === 1} onClick={() => setPage(p=>p-1)} className="px-4 py-2 border rounded-xl disabled:opacity-40 dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">← Prev</button>
            <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {meta.totalPages}</span>
            <button disabled={page === meta.totalPages} onClick={() => setPage(p=>p+1)} className="px-4 py-2 border rounded-xl disabled:opacity-40 dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">Next →</button>
          </div>
        )}
      </main>
    </div>
  );
}
