'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Cpu, RefreshCw, PowerOff, Shield, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function SimulatorPage() {
  const [deviceCode, setDeviceCode] = useState('DEV-001');
  const [deviceSecret, setDeviceSecret] = useState('secret123');
  const [qrUrl, setQrUrl] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchToken = async () => {
    try {
      // Send heartbeat
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/device/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Code': deviceCode,
          'X-Device-Secret': deviceSecret,
        },
        body: JSON.stringify({
          firmware_version: 'sim-1.0.0',
          ip_address: '127.0.0.1',
        }),
      });

      // Get token
      const res = await api.devices.getCurrentToken(deviceCode, deviceSecret);
      
      if (res.success && res.data.has_active_session) {
        const qrDataUrl = await QRCode.toDataURL(res.data.token, {
          width: 300,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        setQrUrl(qrDataUrl);
        setQrToken(res.data.token);
        setSessionInfo(res.data.session);
        setCountdown(30); // Reset countdown on new token
      } else {
        setQrUrl('');
        setQrToken('');
        setSessionInfo(null);
      }
    } catch (error) {
      console.error('Failed to fetch token:', error);
      toast.error('Device authentication failed or device not found.');
      stopSimulation();
    }
  };

  const startSimulation = () => {
    if (!deviceCode || !deviceSecret) {
      toast.error('Device Code and Secret are required');
      return;
    }
    setIsActive(true);
    fetchToken();
    
    // Fetch token every 30 seconds
    const interval = setInterval(fetchToken, 30000);
    setRefreshInterval(interval);

    // Update countdown every second
    const countInt = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 30));
    }, 1000);
    setCountdownInterval(countInt);
    
    toast.success('Simulation started');
  };

  const stopSimulation = () => {
    setIsActive(false);
    setQrUrl('');
    setQrToken('');
    setSessionInfo(null);
    if (refreshInterval) clearInterval(refreshInterval);
    if (countdownInterval) clearInterval(countdownInterval);
  };

  useEffect(() => {
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [refreshInterval, countdownInterval]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">ESP32 Device Simulator</h1>
        <p className="text-[var(--text-secondary)]">Test dynamic QR generation and device authentication without physical hardware.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu size={18} className="text-[var(--primary-500)]" />
              Device Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Device Code"
              value={deviceCode}
              onChange={(e) => setDeviceCode(e.target.value)}
              disabled={isActive}
            />
            <Input
              label="Device Secret"
              type="password"
              value={deviceSecret}
              onChange={(e) => setDeviceSecret(e.target.value)}
              disabled={isActive}
            />
            
            <div className="pt-4 border-t border-[var(--border-color)]">
              {isActive ? (
                <Button variant="danger" className="w-full" onClick={stopSimulation}>
                  <PowerOff size={16} /> Stop Simulation
                </Button>
              ) : (
                <Button className="w-full" onClick={startSimulation}>
                  <RefreshCw size={16} /> Start Simulation
                </Button>
              )}
            </div>
            
            <div className="text-sm p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] mt-4">
              <p className="font-medium mb-1">How this works:</p>
              <ul className="list-disc pl-4 text-[var(--text-secondary)] space-y-1">
                <li>Authenticates using X-Device-Code and X-Device-Secret headers.</li>
                <li>Sends a heartbeat ping every 30s.</li>
                <li>Fetches a fresh cryptographic token every 30s.</li>
                <li>Generates the QR code client-side from the token.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Smartphone size={18} className="text-[var(--primary-500)]" />
                Virtual Display
              </CardTitle>
              {isActive && (
                <Badge variant={sessionInfo ? 'success' : 'warning'}>
                  {sessionInfo ? 'Session Active' : 'Waiting for Session'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--bg-tertiary)] rounded-b-xl border-t border-[var(--border-color)]">
            {!isActive ? (
              <div className="text-center text-[var(--text-muted)] max-w-sm">
                <PowerOff size={48} className="mx-auto mb-4 opacity-20" />
                <p>Simulator is offline.</p>
                <p className="text-sm">Configure device credentials and start the simulation to see the virtual display.</p>
              </div>
            ) : qrUrl ? (
              <div className="text-center w-full max-w-sm mx-auto">
                <div className="mb-6 text-left w-full">
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">{sessionInfo?.title}</h3>
                  <p className="text-[var(--text-secondary)] text-sm">
                    {format(new Date(sessionInfo?.start_time), 'h:mm a')} - {format(new Date(sessionInfo?.end_time), 'h:mm a')}
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-2xl shadow-xl inline-block mx-auto mb-6 relative">
                  <img src={qrUrl} alt="Attendance QR Code" className="w-64 h-64 object-contain" />
                  
                  {/* Scanning scan line animation */}
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-[var(--primary-500)] shadow-[0_0_8px_2px_rgba(99,102,241,0.5)] animate-slide-down" style={{ animationDuration: '2s', animationIterationCount: 'infinite', animationDirection: 'alternate' }}></div>
                </div>
                
                <div className="flex items-center justify-center gap-4 text-sm font-medium">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <RefreshCw size={14} className={countdown <= 5 ? 'text-[var(--error)] animate-spin' : ''} />
                    Refreshes in: <span className={`w-6 text-center ${countdown <= 5 ? 'text-[var(--error)]' : 'text-[var(--text-primary)]'}`}>{countdown}s</span>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--bg-primary)] p-2 rounded-lg border border-[var(--border-color)]">
                  <Shield size={12} />
                  Token: <span className="font-mono text-[var(--text-secondary)] truncate w-32">{qrToken}</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-[var(--text-muted)] max-w-sm">
                <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">No Active Session</h3>
                <p className="text-sm">This device is not assigned to any currently running attendance session.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
