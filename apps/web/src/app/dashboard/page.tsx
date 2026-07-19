'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (['SUPER_ADMIN', 'HR_MANAGER'].includes(parsedUser.role)) {
      fetch('http://localhost:3001/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => { setStats(data); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [router]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;

  const cards = stats
    ? [
        { label: 'Total Employees', value: stats.total, color: 'from-blue-500 to-blue-700', icon: '👥' },
        { label: 'Active', value: stats.active, color: 'from-green-500 to-green-700', icon: '✅' },
        { label: 'Inactive', value: stats.inactive, color: 'from-red-500 to-red-700', icon: '🔴' },
        { label: 'Departments', value: stats.departmentCount, color: 'from-purple-500 to-purple-700', icon: '🏢' },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-blue-600">EMS</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-gray-600 dark:text-gray-300 text-sm">Employee Management System</span>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex gap-6 text-sm font-medium">
              <a href="/dashboard" className="text-blue-600 border-b-2 border-blue-600 pb-1">Dashboard</a>
              <a href="/employees" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 transition">Employees</a>
              <a href="/organization" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 transition">Org Chart</a>
            </nav>
            <div className="flex items-center gap-3 ml-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800 dark:text-white">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role?.replace('_', ' ')}</p>
              </div>
              <button onClick={logout} className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 mt-1">Here's what's happening in your organization today.</p>
        </div>

        {stats ? (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {cards.map((card) => (
                <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 text-white shadow-lg`}>
                  <div className="text-3xl mb-2">{card.icon}</div>
                  <div className="text-4xl font-bold">{card.value}</div>
                  <div className="text-sm opacity-90 mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Dept breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Employees by Department</h2>
              <div className="space-y-3">
                {stats.employeesByDepartment?.map((d: any) => (
                  <div key={d.department} className="flex items-center gap-4">
                    <span className="w-40 text-sm text-gray-600 dark:text-gray-300 truncate">{d.department}</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full transition-all"
                        style={{ width: `${stats.active > 0 ? (d.count / stats.active) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 w-8 text-right">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center text-gray-500">
            <p className="text-5xl mb-4">👤</p>
            <p className="text-lg font-medium">You're viewing your own profile</p>
            <p className="text-sm mt-1">As an Employee, you can view your profile and the org chart.</p>
            <button onClick={() => router.push('/employees')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">View My Profile</button>
          </div>
        )}
      </main>
    </div>
  );
}
