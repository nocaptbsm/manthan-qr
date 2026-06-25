'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, CheckCircle, XCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (scanning && !result) {
      const scanner = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        false
      );

      scanner.render(
        async (decodedText) => {
          scanner.clear();
          setScanning(false);
          await handleScan(decodedText);
        },
        (error) => {
          // Ignored continuously
        }
      );

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [scanning, result]);

  const handleScan = async (token: string) => {
    setLoading(true);
    try {
      const res = await api.attendance.mark(token) as any;
      setResult('success');
      setMessage(`Attendance marked successfully as ${res.data.status}!`);
      toast.success('Attendance Marked!');
      
      // Auto redirect after 3 seconds
      setTimeout(() => {
        router.push('/student/dashboard');
      }, 3000);
    } catch (err: any) {
      setResult('error');
      setMessage(err.message || 'Failed to mark attendance. Token may be expired or used.');
      toast.error('Scan Failed');
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setMessage('');
    setScanning(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
      <Card className="w-full max-w-md overflow-hidden relative">
        <Link href="/student/dashboard" className="absolute top-4 left-4 z-10 w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shadow-sm">
          <ArrowLeft size={16} />
        </Link>
        
        <CardContent className="p-0">
          <div className="bg-gradient-to-b from-[var(--primary-600)] to-[var(--primary-800)] text-white p-8 text-center rounded-t-xl">
            <h1 className="text-2xl font-bold mb-2">Scan QR Code</h1>
            <p className="text-white/80 text-sm">Align the QR code on the device screen within the frame to mark your attendance.</p>
          </div>

          <div className="p-6 bg-[var(--bg-secondary)] flex flex-col items-center justify-center min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center text-[var(--primary-500)]">
                <Loader2 size={48} className="animate-spin mb-4" />
                <p className="font-medium">Verifying Token...</p>
              </div>
            ) : result === 'success' ? (
              <div className="flex flex-col items-center text-center animate-scale-in">
                <div className="w-20 h-20 bg-[var(--success)]/10 text-[var(--success)] rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Success!</h3>
                <p className="text-[var(--text-secondary)] mb-6">{message}</p>
                <p className="text-sm text-[var(--text-muted)] animate-pulse">Redirecting to dashboard...</p>
              </div>
            ) : result === 'error' ? (
              <div className="flex flex-col items-center text-center animate-scale-in">
                <div className="w-20 h-20 bg-[var(--error)]/10 text-[var(--error)] rounded-full flex items-center justify-center mb-4">
                  <XCircle size={40} />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Scan Failed</h3>
                <p className="text-[var(--text-secondary)] mb-6">{message}</p>
                <Button onClick={resetScanner} className="w-full">Try Again</Button>
              </div>
            ) : scanning ? (
              <div id="reader" className="w-full max-w-[300px] mx-auto rounded-xl overflow-hidden border border-[var(--border-color)]"></div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 bg-[var(--primary-50)] dark:bg-[var(--primary-900)] text-[var(--primary-500)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera size={32} />
                </div>
                <Button onClick={() => setScanning(true)} size="lg" className="w-full">
                  Start Camera
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Required for html5-qrcode styles override */}
      <style jsx global>{`
        #reader { border: none !important; }
        #reader__dashboard_section_csr { display: flex; flex-direction: column; gap: 10px; padding: 10px; }
        #reader__dashboard_section_swaplink { text-decoration: none; color: var(--primary-500); font-size: 14px; margin-top: 10px; display: inline-block; }
        #reader button { background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; }
        #reader button:hover { background: var(--border-color); }
        #reader video { border-radius: 12px; object-fit: cover; }
      `}</style>
    </div>
  );
}
