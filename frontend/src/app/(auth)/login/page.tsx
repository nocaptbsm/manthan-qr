'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

import { Suspense } from 'react';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await api.auth.login(email, password);
      toast.success('Login successful!');
      
      const role = (response.data as any)?.user?.role;
      if (redirectPath) {
        router.push(redirectPath);
      } else if (role === 'super_admin') {
        router.push('/super-admin/dashboard');
      } else if (role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8 text-center lg:text-left">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Welcome Back</h2>
        <p className="text-[var(--text-secondary)]">Sign in to manage your attendance</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={18} />}
          required
        />
        
        <div className="space-y-1.5">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={18} />}
            required
          />
          <div className="flex justify-end">
            <Link 
              href="/forgot-password" 
              className="text-sm text-[var(--primary-500)] hover:text-[var(--primary-600)] font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full mt-2" 
          size="lg" 
          isLoading={loading}
        >
          Sign In
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-[var(--text-secondary)]">
        Don't have an account?{' '}
        <Link href="/signup" className="text-[var(--primary-500)] hover:text-[var(--primary-600)] font-semibold transition-colors">
          Create one now
        </Link>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
