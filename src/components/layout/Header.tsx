'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

// TODO: Customize your navigation links here
const navLinks = [
    { href: '/', label: 'الرئيسية' },
    { href: '/pricing', label: 'الأسعار', className: 'text-[var(--color-primary)] font-bold' },
    { href: '/interpreted-dreams', label: 'أحلام حقيقية وتفسيرها' },
    { href: '/symbols', label: 'قاموس تفسير الأحلام' },
    { href: '/tafsir-al-ahlam', label: 'دليل تفسير الأحلام', className: 'text-[var(--color-gold)]' },
    { href: '/journal', label: 'سجل أحلامي' },
    { href: '/learn', label: 'تعلّم' },
    { href: '/experts', label: 'المفسرون' },
    { href: '/join', label: 'انضم كمفسّر', className: 'text-amber-500 font-bold' },
];

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isMobileMenuOpen]);

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <>
            <header className="header">
                <div className="container header-inner" suppressHydrationWarning>
                    {/* Logo - Always visible */}
                    <Link href="/" className="logo">
                        <div className="logo-icon" suppressHydrationWarning>🌙</div>
                        <span>المُفسِّر</span>
                    </Link>

                    {/* ========================================
                        DESKTOP ONLY: Original nav (unchanged)
                        Hidden on mobile, shown on md+
                    ======================================== */}
                    <nav className="nav" style={{ display: 'none' }} id="desktop-nav">
                        <Link href="/" className="nav-link active">الرئيسية</Link>
                        <Link href="/pricing" className="nav-link text-[var(--color-primary)] font-bold">الأسعار</Link>
                        <Link href="/interpreted-dreams" className="nav-link">أحلام حقيقية وتفسيرها</Link>
                        <Link href="/symbols" className="nav-link">قاموس تفسير الأحلام</Link>
                        <Link href="/tafsir-al-ahlam" className="nav-link text-[var(--color-gold)]">دليل تفسير الأحلام</Link>
                        <Link href="/journal" className="nav-link">سجل أحلامي</Link>
                        <Link href="/learn" className="nav-link">تعلّم</Link>
                        <Link href="/experts" className="nav-link">المفسرون</Link>
                        <Link href="/join" className="nav-link text-amber-500 font-bold">انضم كمفسّر</Link>
                    </nav>

                    {/* DESKTOP ONLY: Auth section */}
                    <div className="flex gap-md items-center" style={{ display: 'none' }} id="desktop-auth" suppressHydrationWarning>
                        {user ? (
                            <div className="flex items-center gap-md">
                                <span className="text-sm text-[var(--color-text-muted)] hidden md:block">
                                    مرحباً، {user.displayName || 'زائر'}
                                </span>
                                {user.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName || 'User'}
                                        className="w-8 h-8 rounded-full border border-[var(--color-border)]"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-[var(--gradient-primary)] flex items-center justify-center text-xs">
                                        👤
                                    </div>
                                )}

                                {user.email === 'dev23hecoplus93mor@gmail.com' && (
                                    <Link href="/admin/dashboard" className="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-none shadow-lg shadow-red-500/20">
                                        لوحة الإدارة 🛡️
                                    </Link>
                                )}

                                <Link href="/dashboard" className="btn btn-primary btn-sm">
                                    لوحة التحكم
                                </Link>
                                <button
                                    onClick={() => logout()}
                                    className="btn btn-ghost btn-sm text-red-400 hover:text-red-300"
                                >
                                    خروج
                                </button>
                            </div>
                        ) : (
                            <Link href="/auth/login" className="btn btn-primary btn-sm">
                                تسجيل الدخول
                            </Link>
                        )}
                    </div>

                    {/* ========================================
                        MOBILE ONLY: Hamburger button
                        Shown on mobile, hidden on md+
                    ======================================== */}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label={isMobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
                        aria-expanded={isMobileMenuOpen}
                    >
                        <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                        <span className={`block w-5 h-0.5 bg-white mt-1.5 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                        <span className={`block w-5 h-0.5 bg-white mt-1.5 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
                    </button>
                </div>
            </header>

            {/* ========================================
                MOBILE ONLY: Overlay
            ======================================== */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[998]"
                    onClick={closeMobileMenu}
                    aria-hidden="true"
                    style={{ display: 'block' }}
                />
            )}

            {/* ========================================
                MOBILE ONLY: Drawer (RTL - slides from right)
            ======================================== */}
            <div
                ref={menuRef}
                className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-[var(--color-bg-secondary)] border-l border-[var(--color-border)] z-[999] transform transition-transform duration-300 ease-out overflow-y-auto ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                role="dialog"
                aria-modal="true"
                aria-label="القائمة الرئيسية"
                id="mobile-drawer"
            >
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                    <Link href="/" className="logo text-lg" onClick={closeMobileMenu}>
                        <div className="logo-icon w-8 h-8 text-base" suppressHydrationWarning>🌙</div>
                        <span>المُفسِّر</span>
                    </Link>
                    <button
                        onClick={closeMobileMenu}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white text-xl transition-colors"
                        aria-label="إغلاق القائمة"
                    >
                        ✕
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="p-4 flex flex-col gap-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={closeMobileMenu}
                            className={`block py-3 px-4 rounded-lg text-base font-medium transition-colors ${pathname === link.href
                                ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary-light)]'
                                : 'text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-white'
                                } ${link.className || ''}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Divider */}
                <div className="mx-4 border-t border-[var(--color-border)]" />

                {/* Auth Section */}
                <div className="p-4">
                    {user ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                {user.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName || 'User'}
                                        className="w-10 h-10 rounded-full border-2 border-[var(--color-primary)]"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-lg">
                                        👤
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white truncate">
                                        {user.displayName || 'زائر'}
                                    </div>
                                    <div className="text-xs text-[var(--color-text-muted)] truncate">
                                        {user.email}
                                    </div>
                                </div>
                            </div>

                            {user.email === 'dev23hecoplus93mor@gmail.com' && (
                                <Link
                                    href="/admin/dashboard"
                                    onClick={closeMobileMenu}
                                    className="btn bg-red-500 hover:bg-red-600 text-white w-full justify-center"
                                >
                                    لوحة الإدارة 🛡️
                                </Link>
                            )}

                            <Link
                                href="/dashboard"
                                onClick={closeMobileMenu}
                                className="btn btn-primary w-full justify-center"
                            >
                                لوحة التحكم
                            </Link>
                            <button
                                onClick={() => {
                                    logout();
                                    closeMobileMenu();
                                }}
                                className="btn btn-ghost w-full justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                                تسجيل الخروج
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <Link
                                href="/auth/login"
                                onClick={closeMobileMenu}
                                className="btn btn-primary w-full justify-center"
                            >
                                تسجيل الدخول
                            </Link>
                            <Link
                                href="/auth/register"
                                onClick={closeMobileMenu}
                                className="btn btn-outline w-full justify-center"
                            >
                                إنشاء حساب جديد
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* ========================================
                CSS: Control desktop/mobile visibility
            ======================================== */}
            <style jsx global>{`
                /* DESKTOP: Show nav and auth on md+ */
                @media (min-width: 768px) {
                    #desktop-nav,
                    #desktop-auth {
                        display: flex !important;
                    }
                    .mobile-menu-btn,
                    #mobile-drawer {
                        display: none !important;
                    }
                }

                /* MOBILE: Show hamburger, hide desktop nav */
                @media (max-width: 767px) {
                    #desktop-nav,
                    #desktop-auth {
                        display: none !important;
                    }
                    .mobile-menu-btn {
                        display: flex !important;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        width: 44px;
                        height: 44px;
                        background: rgba(255, 255, 255, 0.05);
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: background 0.2s;
                    }
                    .mobile-menu-btn:hover {
                        background: rgba(255, 255, 255, 0.1);
                    }
                    #mobile-drawer {
                        display: block !important;
                    }
                }
            `}</style>
        </>
    );
}
