'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    Wallet,
    Star,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    Shield
} from 'lucide-react';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    // Strict Role-Based Access Control using Context (Role is trusted from DB sync)
    const { user, profile, loading, logout } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace('/auth/login');
            } else if (profile?.role !== 'admin') {
                console.warn('Unauthorized access attempt to admin panel');
                router.replace('/');
            } else {
                setIsAuthorized(true);
            }
        }
    }, [user, profile, loading, router]);

    const handleLogout = async () => {
        await logout();
        router.push('/auth/login');
    };

    if (loading || !isAuthorized) {
        return (
            <div className="min-h-screen bg-[#050510] flex items-center justify-center text-white">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">جاري التحقق من الصلاحيات...</p>
                </div>
            </div>
        );
    }

    const menuItems = [
        { icon: LayoutDashboard, label: 'نظرة عامة', href: '/admin/dashboard' },
        { icon: Users, label: 'المفسّرون', href: '/admin/dashboard/interpreters' },
        { icon: MessageSquare, label: 'الطلبات', href: '/admin/dashboard/orders' },
        { icon: Wallet, label: 'الإيرادات', href: '/admin/dashboard/revenue' },
        { icon: Star, label: 'التقييمات', href: '/admin/dashboard/reviews' },
        { icon: FileText, label: 'سجلات النظام', href: '/admin/dashboard/audit' },
        { icon: Settings, label: 'الإعدادات', href: '/admin/dashboard/settings' },
    ];

    return (
        <div className="min-h-screen bg-[#050510] text-white font-sans flex text-right" dir="rtl" suppressHydrationWarning>
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
                    fixed lg:sticky top-0 right-0 h-screen w-72 bg-[#0a0a1a] border-l border-white/5 
                    transform transition-transform duration-300 ease-in-out z-50
                    ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                `}
            >
                <div className="p-6 flex items-center justify-between border-b border-white/5">
                    <Link href="/admin/dashboard" className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="text-red-500" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">الإدارة</span>
                    </Link>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden text-gray-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4">
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
                                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
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
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl w-full transition-colors"
                    >
                        <LogOut size={20} />
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Header (Mobile & Desktop) */}
                <header className="h-20 border-b border-white/5 bg-[#050510]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 lg:px-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg"
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="text-xl font-bold hidden md:block text-gray-200">لوحة التحكم المركزية</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                            <Bell size={24} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#050510]"></span>
                        </button>
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 font-bold">
                            {(profile?.displayName || 'Admin').charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
