'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Calendar, CheckCircle, Clock } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import type { StudentStats } from '@/types';
import { format } from 'date-fns';

export default function StudentDashboard() {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.attendance.getStats();
        setStats(response.data as StudentStats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return <Badge variant="success">Present</Badge>;
      case 'late': return <Badge variant="warning">Late</Badge>;
      case 'excused': return <Badge variant="info">Excused</Badge>;
      default: return <Badge variant="error">Absent</Badge>;
    }
  };

  const columns = [
    { header: 'Session', accessorKey: 'attendance_sessions.title' },
    { 
      header: 'Date & Time', 
      accessorKey: 'marked_at',
      cell: (item: any) => format(new Date(item.marked_at), 'MMM dd, yyyy h:mm a')
    },
    { header: 'Device / Location', accessorKey: 'devices.location_name' },
    { 
      header: 'Status', 
      accessorKey: 'status',
      cell: (item: any) => getStatusBadge(item.status)
    },
  ];

  if (loading) {
    return <div className="space-y-6">
      <div className="flex gap-6 animate-pulse">
        <div className="h-32 bg-[var(--bg-tertiary)] rounded-xl flex-1"></div>
        <div className="h-32 bg-[var(--bg-tertiary)] rounded-xl flex-1"></div>
        <div className="h-32 bg-[var(--bg-tertiary)] rounded-xl flex-1"></div>
        <div className="h-32 bg-[var(--bg-tertiary)] rounded-xl flex-1"></div>
      </div>
      <div className="h-96 bg-[var(--bg-tertiary)] rounded-xl animate-pulse"></div>
    </div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-[var(--text-secondary)]">Welcome back! Here's your attendance overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Attendance Rate"
          value={`${Math.round(stats?.attendancePercentage || 0)}%`}
          icon={<ClipboardList size={20} />}
          trend={{ value: 2.5, isPositive: true }}
        />
        <StatCard
          title="Total Attended"
          value={stats?.attended || 0}
          icon={<CheckCircle size={20} />}
        />
        <StatCard
          title="Late Arrivals"
          value={stats?.late || 0}
          icon={<Clock size={20} />}
        />
        <StatCard
          title="Current Streak"
          value={`${stats?.streak || 0} days`}
          icon={<Calendar size={20} />}
        />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={stats?.recentRecords || []}
            columns={columns}
            emptyMessage="You haven't marked any attendance yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
