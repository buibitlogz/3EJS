'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useQuickAction } from '@/hooks/useQuickAction';
import { UserRole } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { syncFromRemote } from '@/lib/unified-db';

interface NavItem {
  label: string;
  href: string;
  allowedRoles: UserRole[];
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', allowedRoles: [UserRole.ADMIN], icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Subscribers', href: '/subscribers', allowedRoles: [UserRole.ADMIN, UserRole.TECHNICIAN, UserRole.E_LOAD, UserRole.VIEW_ONLY], icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { label: 'Clawback', href: '/clawback', allowedRoles: [UserRole.ADMIN, UserRole.TECHNICIAN], icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  { label: 'E-Load', href: '/eload', allowedRoles: [UserRole.ADMIN, UserRole.E_LOAD], icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { label: 'Historical Data', href: '/historical', allowedRoles: [UserRole.ADMIN, UserRole.TECHNICIAN, UserRole.E_LOAD, UserRole.VIEW_ONLY], icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  // { label: 'Technicians', href: '/technicians', allowedRoles: [UserRole.ADMIN], icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16 9 16 11s2 5.657 5-2.343a8 8 0 01-3.343 12z' },
  { label: 'Reports', href: '/reporting', allowedRoles: [UserRole.ADMIN], icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { label: 'Settings', href: '/settings', allowedRoles: [UserRole.ADMIN], icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
];

function NavIcon({ d, className = '' }: { d: string; className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { setOpenNewInstallation, setOpenNewELoad } = useQuickAction();
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleLogoSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await syncFromRemote();
      window.dispatchEvent(new CustomEvent('db-synced'));
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  if (!user) return null;

  const visibleItems = navItems.filter((item) => item.allowedRoles.includes(user.role));

  const handleNewInstallation = () => {
    setOpenNewInstallation(true);
    if (pathname !== '/subscribers') {
      router.push('/subscribers');
    }
  };

  const handleNewELoad = () => {
    setOpenNewELoad(true);
    if (pathname !== '/eload') {
      router.push('/eload');
    }
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="w-64 min-h-screen bg-surface flex flex-col"
    >
      {/* Brand */}
      <div className="p-5 pb-6">
        <Link href="/dashboard" onClick={handleLogoSync} className={`flex items-center gap-3 group ${isSyncing ? 'opacity-70 pointer-events-none' : ''}`}>
          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
            <Image src="/logo.png" alt="3EJS" width={36} height={36} className="rounded-lg" unoptimized />
          </div>
          <div>
            <span className="text-lg font-bold text-text tracking-tight">3EJS Tech</span>
            <p className="text-[10px] text-text/20 text-center mt-2">&copy; 2026 3EJS Tech</p>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="px-3 pb-3">
        {(user.role === UserRole.ADMIN || user.role === UserRole.TECHNICIAN) && (
          <button
            onClick={handleNewInstallation}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white text-sm font-medium hover:from-orange-600 hover:via-red-600 hover:to-pink-600 transition-all shadow-lg shadow-orange-500/30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Installation
          </button>
        )}
        {(user.role === UserRole.ADMIN || user.role === UserRole.E_LOAD) && (
          <button
            onClick={handleNewELoad}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white text-sm font-medium hover:from-orange-600 hover:via-red-600 hover:to-pink-600 transition-all shadow-lg shadow-orange-500/30 mt-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            New E-Load
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <ul className="space-y-1">
          <AnimatePresence>
            {visibleItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-primary text-white'
                      : 'text-text/60 hover:text-text hover:bg-primary/5'
                  }`}
                >
                  <NavIcon d={item.icon} className={pathname === item.href ? 'text-white' : ''} />
                  {item.label}
                </Link>
              </li>
            ))}
          </AnimatePresence>
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="text-xs text-text/50">
            <p className="font-medium">{user?.name}</p>
            <p className="text-[10px] capitalize">{user?.role?.replace('_', ' ').toLowerCase()}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-text/50 hover:text-red-500 hover:bg-red-500/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3A2.25 2.25 0 008.25 5.25v13.5A2.25 2.25 0 0010.5 21h3a2.25 2.25 0 002.25-2.25V15m4.5-6l-3-3m0 0l-3 3m3-3v9" />
            </svg>
          </button>
        </div>
      </div>
    </motion.aside>
  );
};