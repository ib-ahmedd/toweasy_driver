'use client';

import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('driverToken');
    if (!token && pathname !== '/login') {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('driverToken');
    router.push('/login');
  };

  return (
    <html lang="en">
      <body>
        {isAuthenticated || pathname === '/login' ? (
          <div className="app-layout">
            {pathname !== '/login' && <Sidebar />}
            <div className="main-content">
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2>TowEasy Driver</h2>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Secure Driver Portal</div>
                </div>
                {pathname !== '/login' && (
                  <button className="logout-btn-premium" onClick={handleLogout}>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      strokeWidth={2.5} 
                      stroke="currentColor" 
                      style={{ width: '16px', height: '16px' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Logout
                  </button>
                )}
              </header>
              {children}
            </div>
          </div>
        ) : (
          <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>
        )}
      </body>
    </html>
  );
}
