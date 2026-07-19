'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

function OrgNode({ node, depth = 0 }: { node: any; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    HR_MANAGER: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    EMPLOYEE: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  };

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''} mt-3`}>
      <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {node.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white truncate">{node.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{node.designation}</p>
          <div className="flex gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[node.role] || ''}`}>
              {node.role.replace('_', ' ')}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {node.department?.name}
            </span>
          </div>
        </div>
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 transition"
          >
            {expanded ? '−' : '+'}
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child: any) => (
            <OrgNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrganizationPage() {
  const [tree, setTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchTree = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    try {
      const res = await fetch('http://localhost:3001/api/organization/tree', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch org tree');
      const data = await res.json();
      setTree(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <span className="text-2xl font-bold text-blue-600">EMS</span>
          <div className="flex gap-6 text-sm font-medium">
            <a href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">Dashboard</a>
            <a href="/employees" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">Employees</a>
            <a href="/organization" className="text-blue-600 border-b-2 border-blue-600 pb-1">Org Chart</a>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Organization Chart</h1>
        <p className="text-gray-500 mb-8">Explore the reporting hierarchy of your organization.</p>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading org chart...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : tree.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No hierarchy data found.</div>
        ) : (
          <div>
            {tree.map((root) => (
              <OrgNode key={root.id} node={root} depth={0} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
