'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Dream {
    id: string;
    slug: string;
    title: string;
    content: string;
    date: string;
}

export default function RecentDreamsFeed() {
    const [dreams, setDreams] = useState<Dream[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDreams = async () => {
            try {
                const res = await fetch('/api/dreams/public?limit=6');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.dreams) {
                        setDreams(data.dreams);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch public dreams", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDreams();
    }, []);

    if (loading) return null;
    if (dreams.length === 0) return null;

    return (
        <section className="section" style={{ background: 'var(--color-bg-primary)', paddingTop: '3rem', paddingBottom: '3rem' }}>
            <div className="container" suppressHydrationWarning>
                <div className="text-center mb-8" suppressHydrationWarning>
                    <span className="cro-section-badge">مباشر الآن</span>
                    <h2 className="mt-3 mb-3" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}>أحدث الأحلام المفسرة</h2>
                    <p className="text-gray-400 text-sm max-w-md mx-auto">تصفح آخر ما فسره المفسر بالذكاء الاصطناعي والمفسرون المعتمدون</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" suppressHydrationWarning>
                    {dreams.map((dream) => (
                        <Link href={`/${dream.slug}`} key={dream.id} className="glass-card hover:border-[var(--color-primary)] transition-all duration-300 transform hover:-translate-y-1">
                            <h3 className="font-bold text-white mb-2 line-clamp-1">{dream.title}</h3>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{dream.content}</p>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>{new Date(dream.date).toLocaleDateString('ar-SA')}</span>
                                <span className="text-[var(--color-primary-light)]">اقرأ التفسير ←</span>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="text-center mt-8" suppressHydrationWarning>
                    <Link href="/interpreted-dreams" className="btn btn-outline btn-sm">
                        عرض جميع الأحلام المفسرة ←
                    </Link>
                </div>
            </div>
        </section>
    );
}
