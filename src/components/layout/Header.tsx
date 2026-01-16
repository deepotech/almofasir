'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';


export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const { user, logout } = useAuth();

    return (
        <>
            <header className="header">
                <div className="container header-inner" suppressHydrationWarning>
                    <Link href="/" className="logo">
                        <div className="logo-icon" suppressHydrationWarning>🌙</div>
                        <span>المُفسِّر</span>
                    </Link>

                    <nav className="nav">
                        <Link href="/" className="nav-link active">الرئيسية</Link>
                        <Link href="/pricing" className="nav-link text-[var(--color-primary)] font-bold">الأسعار</Link>
                        <Link href="/interpreted-dreams" className="nav-link">أحلام حقيقية وتفسيرها</Link>
                        <Link href="/symbols" className="nav-link">قاموس تفسير الأحلام</Link>
                        <Link href="/journal" className="nav-link">سجل أحلامي</Link>
                        <Link href="/learn" className="nav-link">تعلّم</Link>
                        <Link href="/experts" className="nav-link">المفسرون</Link>
                        <Link href="/join" className="nav-link text-amber-500 font-bold">انضم كمفسّر</Link>
                    </nav>

                    <div className="flex gap-md items-center" suppressHydrationWarning>
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

                                {/* Admin Link */}
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
                            <Link
                                href="/auth/login"
                                className="btn btn-primary btn-sm"
                            >
                                تسجيل الدخول
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="القائمة"
                        style={{
                            display: 'none',
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            fontSize: '1.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        ☰
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="mobile-menu" style={{
                        position: 'absolute',
                        top: '70px',
                        left: 0,
                        right: 0,
                        background: 'var(--color-bg-secondary)',
                        padding: 'var(--spacing-lg)',
                        borderBottom: '1px solid var(--color-border)'
                    }}>
                        <Link href="/" className="nav-link block mb-md">الرئيسية</Link>
                        <Link href="/pricing" className="nav-link block mb-md text-[var(--color-primary)]">الأسعار</Link>
                        <Link href="/interpreted-dreams" className="nav-link block mb-md">أحلام حقيقية وتفسيرها</Link>
                        <Link href="/symbols" className="nav-link block mb-md">قاموس تفسير الأحلام</Link>
                        <Link href="/journal" className="nav-link block mb-md">سجل أحلامي</Link>
                        <Link href="/learn" className="nav-link block mb-md">تعلّم</Link>
                        <Link href="/experts" className="nav-link block mb-md">المفسرون</Link>
                        <Link href="/join" className="nav-link block mb-md text-amber-500 font-bold">انضم كمفسّر</Link>

                        {!user && (
                            <Link
                                href="/auth/login"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="btn btn-primary w-full mt-md"
                            >
                                تسجيل الدخول
                            </Link>
                        )}
                    </div>
                )}
            </header>


        </>
    );
}
