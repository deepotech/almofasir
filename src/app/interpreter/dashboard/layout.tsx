'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    MessageSquare,
    Wallet,
    User,
    LogOut,
    Menu,
    X,
    Bell,
    Star,
    Calendar // Added
} from 'lucide-react';

export default function InterpreterDashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    const menuItems = [
        { icon: LayoutDashboard, label: 'الرئيسية', href: '/interpreter/dashboard' },
        { icon: MessageSquare, label: 'الأحلام الواردة', href: '/interpreter/dashboard/requests' },
        { icon: Wallet, label: 'الأرباح', href: '/interpreter/dashboard/earnings' },
        { icon: Star, label: 'التقييمات', href: '/interpreter/dashboard/reviews' },
        { icon: User, label: 'الملف الشخصي', href: '/interpreter/dashboard/profile' },
    ];

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-white font-sans flex text-right" dir="rtl">
            {/* Sidebar Overlay (Mobile) */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:sticky top-0 right-0 h-screen w-72 bg-[var(--color-bg-secondary)] border-l border-white/5 
                    transform transition-transform duration-300 ease-in-out z-50
                    ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                `}
            >
                <div className="p-6 flex items-center justify-between border-b border-white/5">
                    <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-gold)] to-amber-200">
                        المفسّر <span className="text-xs text-[var(--color-primary)] bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">Pro</span>
                    </Link>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden text-gray-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4">
                    <div className="mb-6 px-4 py-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
                                م
                            </div>
                            <div>
                                <p className="font-bold text-sm">مفسّر الأحلام</p>
                                <p className="text-xs text-green-400 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> متصل
                                </p>
                            </div>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                        ${isActive
                                            ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-indigo-500/20'
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }
                                    `}
                                    onClick={() => setIsSidebarOpen(false)}
                                >
                                    <item.icon size={20} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="absolute bottom-0 w-full p-4 border-t border-white/5">
                    <button className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl w-full transition-colors">
                        <LogOut size={20} />
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Header (Mobile & Desktop) */}
                <header className="h-20 border-b border-white/5 bg-[var(--color-bg-primary)]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 lg:px-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg"
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="text-xl font-bold hidden md:block">لوحة تحكم المفسّر</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                            <Bell size={24} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[var(--color-bg-primary)]"></span>
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
