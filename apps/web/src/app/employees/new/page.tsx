'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API = 'http://localhost:3001';

// ⚠️ Must be defined OUTSIDE the page component so React doesn't remount it on every render
interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

function Field({ label, value, onChange, type = 'text', placeholder = '', error, disabled }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-2.5 border ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500'} rounded-xl bg-white dark:bg-gray-700 dark:text-white text-sm focus:ring-2 outline-none transition`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function NewEmployeePage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [designation, setDesignation] = useState('');
  const [salary, setSalary] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [status, setStatus] = useState('ACTIVE');

  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    // Fetch departments list
    fetch(`${API}/api/departments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setDepartments(data); })
      .catch(() => { /* departments will be empty, user can type ID manually */ });
  }, [router]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = 'Invalid email address';
    if (phone.replace(/\D/g, '').length < 10) errs.phone = 'Phone must be at least 10 digits';
    if (!designation.trim()) errs.designation = 'Designation is required';
    if (!salary || parseFloat(salary) <= 0) errs.salary = 'Salary must be greater than 0';
    if (!joiningDate) errs.joiningDate = 'Joining date is required';
    else if (new Date(joiningDate) > new Date()) errs.joiningDate = 'Joining date cannot be in the future';
    if (!departmentId.trim()) errs.departmentId = 'Department is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setApiError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name, email, password, phone,
          departmentId, designation,
          salary: parseFloat(salary),
          joiningDate: new Date(joiningDate).toISOString(),
          role, status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create employee');
      router.push(`/employees/${data.id}`);
    } catch (e: any) {
      setApiError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <span className="text-2xl font-bold text-blue-600">EMS</span>
          <div className="flex gap-6 text-sm font-medium">
            <a href="/dashboard" className="text-gray-600 hover:text-blue-600 dark:text-gray-300">Dashboard</a>
            <a href="/employees" className="text-blue-600 border-b-2 border-blue-600 pb-1">Employees</a>
            <a href="/organization" className="text-gray-600 hover:text-blue-600 dark:text-gray-300">Org Chart</a>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <button onClick={() => router.push('/employees')} className="mb-6 text-sm text-blue-600 hover:underline">← Back to Employees</button>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Add New Employee</h1>
          <p className="text-sm text-gray-500 mb-6">Fill in the details below to create a new employee record.</p>

          {apiError && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">⚠️ {apiError}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Full Name *" value={name} onChange={setName} placeholder="Alice Smith" error={errors.name} />
              <Field label="Email *" value={email} onChange={setEmail} type="email" placeholder="alice@company.com" error={errors.email} />
              <Field label="Phone *" value={phone} onChange={setPhone} placeholder="9876543210" error={errors.phone} />
              <Field label="Password *" value={password} onChange={setPassword} type="password" error={errors.password} />
              <Field label="Designation *" value={designation} onChange={setDesignation} placeholder="Software Engineer" error={errors.designation} />
              <Field label="Salary *" value={salary} onChange={setSalary} type="number" placeholder="75000" error={errors.salary} />
              <Field label="Joining Date *" value={joiningDate} onChange={setJoiningDate} type="date" error={errors.joiningDate} />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department *</label>
                {departments.length > 0 ? (
                  <select
                    value={departmentId}
                    onChange={e => setDepartmentId(e.target.value)}
                    className={`w-full px-4 py-2.5 border ${errors.departmentId ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'} rounded-xl bg-white dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none`}
                  >
                    <option value="">Select department…</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text" value={departmentId} onChange={e => setDepartmentId(e.target.value)}
                    placeholder="Department UUID"
                    className={`w-full px-4 py-2.5 border ${errors.departmentId ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'} rounded-xl bg-white dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none`}
                  />
                )}
                {errors.departmentId && <p className="text-red-500 text-xs mt-1">{errors.departmentId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="EMPLOYEE">Employee</option>
                  <option value="HR_MANAGER">HR Manager</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t dark:border-gray-700">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition disabled:opacity-50 shadow-sm"
              >
                {saving ? 'Creating…' : 'Create Employee →'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
