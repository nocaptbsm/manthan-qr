'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types';
import {
  LayoutDashboard, Users, Calendar, Cpu, FileBarChart, Settings,
  LogOut, Menu, X, Shield, ClipboardList, ChevronRight, Bell,
  Moon, Sun, QrCode
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const navConfigs: Record<string, NavItem[]> = {
  student: [
    { label: 'Dashboard', href: '/student/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Attendance', href: '/student/attendance', icon: <ClipboardList size={20} /> },
    { label: 'Reports', href: '/student/reports', icon: <FileBarChart size={20} /> },
    { label: 'Profile', href: '/student/profile', icon: <Users size={20} /> },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Students', href: '/admin/students', icon: <Users size={20} /> },
    { label: 'Sessions', href: '/admin/attendance', icon: <Calendar size={20} /> },
    { label: 'Devices', href: '/admin/devices', icon: <Cpu size={20} /> },
    { label: 'Reports', href: '/admin/reports', icon: <FileBarChart size={20} /> },
    { label: 'Simulator', href: '/simulator', icon: <QrCode size={20} /> },
    { label: 'Settings', href: '/admin/settings', icon: <Settings size={20} /> },
  ],
  super_admin: [
    { label: 'Dashboard', href: '/super-admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Users', href: '/super-admin/users', icon: <Users size={20} /> },
    { label: 'Devices', href: '/super-admin/devices', icon: <Cpu size={20} /> },
    { label: 'Analytics', href: '/super-admin/analytics', icon: <FileBarChart size={20} /> },
    { label: 'Audit Logs', href: '/super-admin/audit-logs', icon: <Shield size={20} /> },
    { label: 'Simulator', href: '/simulator', icon: <QrCode size={20} /> },
  ],
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        if (profile) setUser(profile);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const role = user?.role || 'student';
  const navItems = navConfigs[role] || navConfigs.student;

  const roleLabel = role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Student';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 40, display: 'none',
          }}
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: 260, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)',
          display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0,
          left: sidebarOpen ? 0 : -260, zIndex: 50,
          transition: 'left 0.3s ease',
        }}
        className="sidebar"
      >
        {/* Logo */}
        <div style={{
          padding: '24px 20px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <QrCode size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>ManthanQR</h1>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {roleLabel}
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--text-muted)', display: 'none',
            }}
            className="sidebar-close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 10,
                  color: isActive ? 'var(--primary-500)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                  fontWeight: isActive ? 600 : 500, fontSize: 14,
                  textDecoration: 'none', transition: 'all 0.15s ease',
                }}
              >
                {item.icon}
                {item.label}
                {isActive && (
                  <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div style={{
          padding: '16px 12px', borderTop: '1px solid var(--border-color)',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--primary-300), var(--primary-500))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 14,
            }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user?.name || 'Loading...'}
              </div>
              <div style={{
                fontSize: 11, color: 'var(--text-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user?.email || ''}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 10, width: '100%',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--error)', fontSize: 14, fontWeight: 500,
            }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{
        flex: 1, marginLeft: 260, display: 'flex', flexDirection: 'column',
        minHeight: '100vh',
      }}
        className="main-content"
      >
        {/* Topbar */}
        <header style={{
          height: 64, background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', padding: '0 24px',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', display: 'none', marginRight: 16,
            }}
            className="menu-toggle"
          >
            <Menu size={24} />
          </button>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={toggleTheme}
              style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--bg-tertiary)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'var(--text-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'var(--bg-tertiary)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--text-secondary)',
              position: 'relative',
            }}>
              <Bell size={18} />
              <span style={{
                position: 'absolute', top: 8, right: 8, width: 8, height: 8,
                borderRadius: '50%', background: 'var(--error)',
              }} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: 24 }}>
          {children}
        </main>
      </div>

      {/* Responsive CSS */}
      <style jsx global>{`
        @media (min-width: 769px) {
          .sidebar { left: 0 !important; }
        }
        @media (max-width: 768px) {
          .main-content { margin-left: 0 !important; }
          .menu-toggle { display: flex !important; }
          .sidebar-close { display: block !important; }
          .mobile-overlay { display: block !important; }
          .sidebar { box-shadow: var(--shadow-xl); }
        }
      `}</style>
    </div>
  );
}
