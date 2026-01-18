'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

const navLinks = [
    { href: '/', label: 'الرئيسية' },
    { href: '/pricing', label: 'الأسعار', highlight: 'primary' },
    { href: '/interpreted-dreams', label: 'أحلام حقيقية' },
    { href: '/symbols', label: 'قاموس الرموز' },
    { href: '/journal', label: 'سجل أحلامي' },
    { href: '/learn', label: 'تعلّم' },
    { href: '/experts', label: 'المفسرون' },
    { href: '/join', label: 'انضم كمفسّر', highlight: 'amber' },
];

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

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
                buttonRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isMobileMenuOpen]);

    // Simple focus trap
    useEffect(() => {
        if (isMobileMenuOpen && menuRef.current) {
            const focusableElements = menuRef.current.querySelectorAll(
                'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements.length > 0) {
                (focusableElements[0] as HTMLElement).focus();
            }
        }
    }, [isMobileMenuOpen]);

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <>
            <header className="header">
                <div className="container header-inner" suppressHydrationWarning>
                    {/* Logo */}
                    <Link href="/" className="logo">
                        <div className="logo-icon" suppressHydrationWarning>🌙</div>
                        <span>المُفسِّر</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`nav-link ${pathname === link.href ? 'active' : ''} ${link.highlight === 'primary' ? 'text-[var(--color-primary)] font-bold' :
                                        link.highlight === 'amber' ? 'text-amber-500 font-bold' : ''
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop Auth Buttons */}
                    <div className="hidden md:flex gap-md items-center" suppressHydrationWarning>
                        {user ? (
                            <div className="flex items-center gap-md">
                                <span className="text-sm text-[var(--color-text-muted)]">
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

                    {/* Mobile Menu Button (Hamburger) */}
                    <button
                        ref={buttonRef}
                        className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label={isMobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
                        aria-expanded={isMobileMenuOpen}
                        aria-controls="mobile-menu"
                    >
                        <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1' : ''}`} />
                        <span className={`block w-5 h-0.5 bg-white mt-1 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                        <span className={`block w-5 h-0.5 bg-white mt-1 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={closeMobileMenu}
                aria-hidden="true"
            />

            {/* Mobile Menu Drawer (RTL: slides from right) */}
            <div
                ref={menuRef}
                id="mobile-menu"
                role="dialog"
                aria-modal="true"
                aria-label="القائمة الرئيسية"
                className={`fixed top-0 right-0 h-full w-[280px] max-w-[85vw] bg-[var(--color-bg-secondary)] border-l border-[var(--color-border)] z-[1000] md:hidden transform transition-transform duration-300 ease-out overflow-y-auto ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                    <Link href="/" className="logo text-lg" onClick={closeMobileMenu}>
                        <div className="logo-icon w-8 h-8 text-base">🌙</div>
                        <span>المُفسِّر</span>
                    </Link>
                    <button
                        onClick={closeMobileMenu}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
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
                                } ${link.highlight === 'primary' ? 'text-[var(--color-primary-light)]' :
                                    link.highlight === 'amber' ? 'text-amber-400' : ''
                                }`}
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
                            {/* User Info */}
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

                            {/* Admin Link */}
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
        </>
    );
}
