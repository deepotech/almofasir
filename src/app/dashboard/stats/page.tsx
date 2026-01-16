'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import Link from 'next/link';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

export default function StatsPage() {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && user) {
            fetchStats();
        }
    }, [user, authLoading]);

    const fetchStats = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/dreams/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch stats');
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error(error);
            setError('عذراً، حدث خطأ أثناء تحميل الإحصائيات. يرجى المحاولة لاحقاً.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-2xl text-center">جاري تحليل بيانات أحلامك... 📊</div>;

    if (error) return (
        <div className="p-2xl text-center">
            <div className="text-red-500 mb-4">⚠️ {error}</div>
            <button onClick={() => window.location.reload()} className="btn btn-outline">
                إعادة المحاولة
            </button>
        </div>
    );

    const moodData = {
        labels: Object.keys(stats?.moods || {}),
        datasets: [{
            data: Object.values(stats?.moods || {}),
            backgroundColor: [
                'rgba(218, 165, 32, 0.7)',  // Gold
                'rgba(75, 192, 192, 0.7)',
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(153, 102, 255, 0.7)',
            ],
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
        }]
    };

    const timelineData = {
        labels: stats?.timeline?.map((t: any) => t._id) || [],
        datasets: [{
            label: 'عدد الأحلام',
            data: stats?.timeline?.map((t: any) => t.count) || [],
            borderColor: '#DAA520',
            backgroundColor: 'rgba(218, 165, 32, 0.2)',
            fill: true,
            tension: 0.4
        }]
    };

    return (
        <div className="stats-container animate-fadeIn">
            <header className="mb-2xl flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold mb-sm">إحصائيات الأحلام 📈</h1>
                    <p className="text-muted">تحليل تفصيلي لرحلتك مع تفسير الأحلام</p>
                </div>
                <Link href="/dashboard" className="btn btn-outline">
                    ← العودة للوحة التحكم
                </Link>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-xl mb-2xl">
                <div className="card text-center p-xl">
                    <h3 className="text-muted mb-sm">إجمالي الأحلام</h3>
                    <p className="text-3xl font-bold text-gold">{stats?.totalDreams || 0}</p>
                </div>
                <div className="card text-center p-xl">
                    <h3 className="text-muted mb-sm">المزاج الغالب</h3>
                    <p className="text-3xl font-bold text-primary">{
                        Object.entries(stats?.moods || {}).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || '-'
                    }</p>
                </div>
                <div className="card text-center p-xl">
                    <h3 className="text-muted mb-sm">المفسر المفضل</h3>
                    <p className="text-3xl font-bold text-secondary">{stats?.topInterpreter || '-'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2xl">
                <div className="card p-xl">
                    <h3 className="text-xl font-bold mb-lg">توزيع المزاج 🎭</h3>
                    <div className="h-64 flex justify-center">
                        {Object.keys(stats?.moods || {}).length > 0 ? (
                            <Doughnut data={moodData} options={{ maintainAspectRatio: false }} />
                        ) : <p className="text-muted self-center">لا توجد بيانات كافية</p>}
                    </div>
                </div>

                <div className="card p-xl">
                    <h3 className="text-xl font-bold mb-lg">النشاط الشهري 📅</h3>
                    <div className="h-64">
                        {stats?.timeline?.length > 0 ? (
                            <Line data={timelineData} options={{ maintainAspectRatio: false }} />
                        ) : <p className="text-muted text-center mt-xl">لا توجد بيانات كافية</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
