'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';

const API = 'http://localhost:3001';

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [salary, setSalary] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [role, setRole] = useState('EMPLOYEE');

  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');

  const fetchEmployee = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');
    try {
      const res = await fetch(`${API}/api/employees/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 403) { setError('You do not have permission to view this profile.'); setLoading(false); return; }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setEmployee(data);
      setPhone(data.phone || '');
      setDesignation(data.designation || '');
      setSalary(String(data.salary || ''));
      setStatus(data.status || 'ACTIVE');
      setRole(data.role || 'EMPLOYEE');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [id, router]);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) { const p = JSON.parse(u); setUserRole(p.role); setUserId(p.id); }
    fetchEmployee();
  }, [fetchEmployee]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true); setError(''); setSaveMsg('');
    const token = localStorage.getItem('token');
    const isSelf = userId === id;
    const isAdmin = userRole === 'SUPER_ADMIN';
    const isHR = userRole === 'HR_MANAGER';

    const payload: Record<string, any> = { phone };
    if (isAdmin || isHR) {
      payload.designation = designation;
      payload.salary = parseFloat(salary);
      payload.status = status;
      if (!(isHR && role === 'SUPER_ADMIN')) payload.role = role;
    }

    try {
      const res = await fetch(`${API}/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setSaveMsg('✅ Changes saved successfully!');
      fetchEmployee();
    } catch (e: any) { setError(e.message); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Soft-delete this employee? Their data will be preserved.')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/api/employees/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      router.push('/employees');
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;

  const isSelf = userId === id;
  const isAdmin = userRole === 'SUPER_ADMIN';
  const isHR = userRole === 'HR_MANAGER';
  const canEditSelf = isSelf || isAdmin || isHR;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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

      <main className="max-w-3xl mx-auto px-6 py-8">
        <button onClick={() => router.push('/employees')} className="mb-6 text-sm text-blue-600 hover:underline">← Back to Employees</button>

        {error && !employee ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-600">{error}</div>
        ) : employee && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold">{employee.name?.charAt(0)}</div>
                  <div className="text-white">
                    <h1 className="text-2xl font-bold">{employee.name}</h1>
                    <p className="text-blue-200">{employee.employeeId} · {employee.designation}</p>
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={handleDelete} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm transition">🗑 Soft Delete</button>
                )}
              </div>
            </div>

            <div className="p-8">
              {saveMsg && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">{saveMsg}</div>}
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

              <form onSubmit={handleUpdate} className="space-y-6">
                {/* Read-only info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                  <div><p className="text-xs text-gray-400 mb-1">Email</p><p className="font-medium dark:text-white">{employee.email}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Department</p><p className="font-medium dark:text-white">{employee.department?.name}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Joining Date</p><p className="font-medium dark:text-white">{new Date(employee.joiningDate).toLocaleDateString()}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Reporting Manager</p><p className="font-medium dark:text-white">{employee.reportingManager?.name ?? 'None (Top Level)'}</p></div>
                </div>

                {/* Editable fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={!canEditSelf}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white disabled:opacity-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Designation</label>
                    <input type="text" value={designation} onChange={e => setDesignation(e.target.value)} disabled={!isAdmin && !isHR}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white disabled:opacity-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salary</label>
                    <input type="number" value={salary} onChange={e => setSalary(e.target.value)} disabled={!isAdmin && !isHR}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white disabled:opacity-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} disabled={!isAdmin && !isHR}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white disabled:opacity-50 text-sm">
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                    <select value={role} onChange={e => setRole(e.target.value)} disabled={!isAdmin && !(isHR && role !== 'SUPER_ADMIN')}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white disabled:opacity-50 text-sm">
                      <option value="EMPLOYEE">Employee</option>
                      <option value="HR_MANAGER">HR Manager</option>
                      {isAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                  <button type="submit" disabled={isSaving || !canEditSelf}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition disabled:opacity-50 shadow-sm">
                    {isSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
