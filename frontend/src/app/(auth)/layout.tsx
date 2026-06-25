export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)]">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[var(--primary-800)] to-[var(--primary-600)] relative overflow-hidden flex-col items-center justify-center p-12 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
        
        <div className="relative z-10 max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl animate-float">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">ManthanQR</h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Smart, dynamic, and fraud-proof attendance management system powered by cryptographic QR codes.
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-10 w-32 h-32 bg-[var(--primary-400)] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse-ring" />
        <div className="absolute bottom-1/4 right-10 w-48 h-48 bg-[var(--accent-400)] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-ring" style={{ animationDelay: '2s' }} />
      </div>
      
      {/* Right Panel - Auth Content */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
