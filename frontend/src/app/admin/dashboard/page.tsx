'use client';

import { useState, useEffect } from 'react';
import { Users, Calendar, Cpu, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import type { DashboardStats } from '@/types';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.dashboard.getStats();
        setStats(response.data as DashboardStats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const columns = [
    { header: 'Student', accessorKey: 'users.name' },
    { header: 'Roll Number', accessorKey: 'users.roll_number' },
    { header: 'Session', accessorKey: 'attendance_sessions.title' },
    { 
      header: 'Time', 
      accessorKey: 'marked_at',
      cell: (item: any) => format(new Date(item.marked_at), 'h:mm a')
    },
    { 
      header: 'Status', 
      accessorKey: 'status',
      cell: (item: any) => (
        <Badge variant={item.status === 'present' ? 'success' : item.status === 'late' ? 'warning' : 'error'}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Badge>
      )
    },
  ];

  if (loading) {
    return <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-[var(--bg-tertiary)] rounded-xl animate-pulse"></div>
        ))}
      </div>
      <div className="h-96 bg-[var(--bg-tertiary)] rounded-xl animate-pulse"></div>
    </div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Admin Dashboard</h1>
        <p className="text-[var(--text-secondary)]">Overview of system activity and attendance metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={<Users size={20} />}
        />
        <StatCard
          title="Today's Attendance"
          value={stats?.todayAttendance || 0}
          icon={<Activity size={20} />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Active Sessions"
          value={stats?.activeSessions || 0}
          icon={<Calendar size={20} />}
        />
        <StatCard
          title="Active Devices"
          value={stats?.activeDevices || 0}
          icon={<Cpu size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable 
              data={stats?.recentScans || []}
              columns={columns}
              emptyMessage="No recent attendance records."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="relative w-48 h-48 flex items-center justify-center mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[var(--bg-tertiary)]"
                  strokeDasharray="100, 100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="text-[var(--primary-500)] transition-all duration-1000 ease-out"
                  strokeDasharray={`${stats?.attendanceRate || 0}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold text-[var(--text-primary)]">{stats?.attendanceRate || 0}%</span>
                <span className="text-xs text-[var(--text-muted)]">Average</span>
              </div>
            </div>
            <p className="text-sm text-center text-[var(--text-secondary)]">
              Overall attendance rate across all active sessions this month.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
