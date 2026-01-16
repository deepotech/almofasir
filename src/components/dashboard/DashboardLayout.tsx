'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const navItems = [
        { name: 'لوحة التحكم', href: '/dashboard', icon: '📊' },
        { name: 'سجل الأحلام', href: '/dashboard/history', icon: '📖' },
        { name: 'تفسير جديد', href: '/dashboard/new', icon: '🌙' },
        { name: 'الإحصائيات', href: '/dashboard/stats', icon: '📈' },
    ];

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 hidden md:flex flex-col border-l border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 backdrop-blur-md fixed h-full z-20">
                <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-center">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-primary-light)] bg-clip-text text-transparent">
                        المفسر
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 shadow-[var(--shadow-glow)]'
                                    : 'hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                                    }`}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-[var(--color-border)]">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-[var(--color-gold)]" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
                                👤
                            </div>
                        )}
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{user?.displayName || 'المستخدم'}</p>
                            <p className="text-xs text-[var(--color-text-muted)] truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                    >
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:mr-64 p-6 md:p-8 overflow-y-auto">
                {/* Mobile Header (visible only on small screens) */}
                <div className="md:hidden mb-6 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-[var(--color-gold)]">المفسر</h1>
                    {/* Add hamburger menu trigger here if needed */}
                </div>

                <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
                    {children}
                </div>
            </main>
        </div>
    );
}
