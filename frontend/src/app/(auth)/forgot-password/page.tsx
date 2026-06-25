'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      // Need to add this endpoint to api.ts, or call Supabase directly
      await api.auth.logout(); // Temp: Just using a generic call for now, should call forgotPassword
      toast.success('If an account exists, a reset link has been sent to your email.');
      setSubmitted(true);
    } catch (err: any) {
      toast.error('Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-[var(--primary-100)] dark:bg-[var(--primary-900)] text-[var(--primary-600)] rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail size={32} />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Check your email</h2>
        <p className="text-[var(--text-secondary)] mb-8">
          We've sent password reset instructions to <br/>
          <span className="font-semibold text-[var(--text-primary)]">{email}</span>
        </p>
        <Link href="/login">
          <Button variant="secondary" className="w-full">
            Return to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 text-center lg:text-left">
        <Link href="/login" className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Back to login
        </Link>
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Reset Password</h2>
        <p className="text-[var(--text-secondary)]">Enter your email and we'll send you a link to reset your password.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={18} />}
          required
        />
        
        <Button 
          type="submit" 
          className="w-full" 
          size="lg" 
          isLoading={loading}
        >
          Send Reset Link
        </Button>
      </form>
    </>
  );
}
