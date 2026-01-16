
'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, profile } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/'); // Redirect to home if not logged in (implement proper login later)
        }
    }, [user, loading, router]);

    // Redirect interpreters to their dedicated dashboard
    useEffect(() => {
        if (!loading && user && profile?.role === 'interpreter') {
            router.push('/interpreter/dashboard');
        }
    }, [loading, user, profile, router]);

    if (loading) {
        return (
            <div className="loading-screen" suppressHydrationWarning>
                <span className="loading-spinner"></span>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="dashboard-layout" suppressHydrationWarning>
            <Sidebar />
            <main className="dashboard-content">
                {children}
            </main>

            <style jsx global>{`
                .dashboard-layout {
                    display: flex;
                    min-height: 100vh;
                    background: var(--color-bg-primary);
                }

                .dashboard-content {
                    flex: 1;
                    margin-right: 280px; /* Sidebar width */
                    padding: var(--spacing-2xl);
                    overflow-y: auto;
                }

                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .dashboard-content {
                        margin-right: 0;
                        padding-top: 80px; /* Space for mobile header */
                    }
                    /* Mobile sidebar logic needed later */
                }
            `}</style>
        </div>
    );
}
