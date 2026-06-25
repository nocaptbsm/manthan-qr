'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { format } from 'date-fns';

export default function StudentAttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const response = await api.attendance.getMy(page, 15);
        setRecords(response.data as any[]);
        if (response.meta) setMeta(response.meta);
      } catch (error) {
        console.error('Failed to fetch attendance:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [page]);

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
      header: 'Session Time', 
      accessorKey: 'session_time',
      cell: (item: any) => `${format(new Date(item.attendance_sessions.start_time), 'h:mm a')} - ${format(new Date(item.attendance_sessions.end_time), 'h:mm a')}`
    },
    { 
      header: 'Marked At', 
      accessorKey: 'marked_at',
      cell: (item: any) => format(new Date(item.marked_at), 'MMM dd, yyyy h:mm a')
    },
    { header: 'Device', accessorKey: 'devices.device_name' },
    { header: 'Location', accessorKey: 'devices.location_name' },
    { 
      header: 'Status', 
      accessorKey: 'status',
      cell: (item: any) => getStatusBadge(item.status)
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Attendance History</h1>
          <p className="text-[var(--text-secondary)]">View your complete attendance record.</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable 
            data={records}
            columns={columns}
            isLoading={loading}
            emptyMessage="No attendance records found."
          />
          
          {meta.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <p className="text-sm text-[var(--text-muted)]">
                Showing page {page} of {meta.totalPages} ({meta.total} total records)
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-sm font-medium hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page === meta.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-sm font-medium hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
