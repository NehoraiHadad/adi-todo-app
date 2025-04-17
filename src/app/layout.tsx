'use client';

import { useEffect } from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Heebo } from 'next/font/google';
import { Toaster as ReactHotToastToaster } from 'react-hot-toast';
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { initMobileImprovements } from '@/utils/mobile';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Hebrew font
const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

// Client component to initialize mobile improvements
function MobileOptimizer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize all mobile improvements
    initMobileImprovements();
  }, []);

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <title>כיתה דיגיטלית</title>
        <meta name="description" content="אפליקציית ווב כיתתית לילדים בגילאי 8-11" />
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${heebo.variable} font-heebo antialiased min-h-screen flex flex-col`}
      >
        <MobileOptimizer>
          <AuthProvider>
            <Navbar />
            <main className="flex-grow">{children}</main>
            
            {/* Toast notifications */}
            <ReactHotToastToaster 
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#ffffff',
                  color: '#334155',
                  fontFamily: 'var(--font-heebo)',
                  direction: 'rtl',
                  textAlign: 'right',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  maxWidth: '95vw',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
            <Toaster />
          </AuthProvider>
        </MobileOptimizer>
      </body>
    </html>
  );
}
