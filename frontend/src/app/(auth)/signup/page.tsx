'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Hash, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roll_number: '',
    phone: '',
    role: 'student' as 'student' | 'admin',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await api.auth.signup(formData);
      toast.success('Account created successfully!');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6 text-center lg:text-left">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Create Account</h2>
        <p className="text-[var(--text-secondary)]">Join ManthanQR to start tracking attendance</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <Input
            id="name"
            label="Full Name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            icon={<User size={18} />}
            required
          />
        </div>

        <Input
          id="email"
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          icon={<Mail size={18} />}
          required
        />
        
        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="Min 8 characters"
          value={formData.password}
          onChange={handleChange}
          icon={<Lock size={18} />}
          required
        />

        <div className="flex flex-col gap-1.5 w-full">
          <label htmlFor="role" className="text-sm font-medium text-[var(--text-secondary)]">
            I am a...
          </label>
          <select
            id="role"
            value={formData.role}
            onChange={handleChange}
            className="input appearance-none bg-no-repeat bg-[right_12px_center] bg-[url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%2394a3b8\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m6 9 6 6 6-6\"/></svg>')]"
          >
            <option value="student">Student</option>
            <option value="admin">Teacher / Administrator</option>
          </select>
        </div>

        {formData.role === 'student' && (
          <Input
            id="roll_number"
            label="Roll Number / ID"
            placeholder="Optional"
            value={formData.roll_number}
            onChange={handleChange}
            icon={<Hash size={18} />}
          />
        )}

        <Input
          id="phone"
          label="Phone Number"
          placeholder="Optional"
          value={formData.phone}
          onChange={handleChange}
          icon={<Phone size={18} />}
        />

        <Button 
          type="submit" 
          className="w-full mt-4" 
          size="lg" 
          isLoading={loading}
        >
          Sign Up
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
        Already have an account?{' '}
        <Link href="/login" className="text-[var(--primary-500)] hover:text-[var(--primary-600)] font-semibold transition-colors">
          Sign In
        </Link>
      </div>
    </>
  );
}
