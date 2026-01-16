
'use client';

import { useRouter } from 'next/navigation';

interface StatsProps {
    totalDreams: number;
    topMood: string;
    topInterpreter: string;
    streak: number;
    avgRating?: number;
    aiPercentage?: number;
}

export default function StatsCards({ stats }: { stats: StatsProps }) {
    const router = useRouter();

    const cards = [
        {
            label: 'إجمالي الأحلام',
            value: stats.totalDreams,
            icon: '📚',
            color: 'var(--gradient-primary)',
            href: '/dashboard/journal',
            tooltip: 'عدد الأحلام التي قمت بتفسيرها'
        },
        {
            label: 'متوسط التقييم',
            value: `${stats.avgRating || 4.5}⭐`,
            icon: '⭐',
            color: 'linear-gradient(135deg, #f0932b 0%, #ffbe76 100%)',
            href: '/dashboard/stats',
            tooltip: 'تقييم المستخدمين للتفسيرات'
        },
        {
            label: 'نوع التفسير',
            value: `${stats.aiPercentage || 100}% ذكاء`,
            icon: '🧠',
            color: 'linear-gradient(135deg, #4834d4 0%, #686de0 100%)',
            href: '/dashboard/stats',
            tooltip: 'نسبة التفسيرات بالذكاء الاصطناعي'
        },
        {
            label: 'أيام متتالية',
            value: `${stats.streak} أيام`,
            icon: '🔥',
            color: 'linear-gradient(135deg, #FF6B6B 0%, #EE5253 100%)',
            href: '/dashboard/stats',
            tooltip: 'سلسلة الأيام النشطة'
        },
    ];

    return (
        <div className="stats-grid">
            {cards.map((card, idx) => (
                <div
                    key={idx}
                    className="stat-card"
                    onClick={() => router.push(card.href)}
                    title={card.tooltip}
                    role="button"
                    tabIndex={0}
                >
                    <div className="stat-icon-wrapper" style={{ background: card.color }}>
                        {card.icon}
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-value">{card.value}</h3>
                        <p className="stat-label">{card.label}</p>
                    </div>
                    <div className="stat-arrow">←</div>
                </div>
            ))}
            <style jsx>{`
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: var(--spacing-lg);
                    margin-bottom: var(--spacing-2xl);
                }
                .stat-card {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: var(--radius-lg);
                    padding: var(--spacing-lg);
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-md);
                    transition: all 0.25s ease;
                    cursor: pointer;
                    position: relative;
                }
                .stat-card:hover {
                    transform: translateY(-5px);
                    background: rgba(255, 255, 255, 0.05);
                    border-color: var(--color-primary);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                }
                .stat-card:focus {
                    outline: 2px solid var(--color-primary);
                    outline-offset: 2px;
                }
                .stat-icon-wrapper {
                    width: 50px;
                    height: 50px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    flex-shrink: 0;
                }
                .stat-content {
                    flex: 1;
                }
                .stat-value {
                    font-size: 1.4rem;
                    font-weight: bold;
                    color: var(--color-text-primary);
                    margin: 0;
                    line-height: 1.2;
                }
                .stat-label {
                    color: var(--color-text-secondary);
                    font-size: 0.85rem;
                    margin: 0;
                    margin-top: 2px;
                }
                .stat-arrow {
                    color: var(--color-text-muted);
                    font-size: 1rem;
                    opacity: 0;
                    transition: opacity 0.2s, transform 0.2s;
                }
                .stat-card:hover .stat-arrow {
                    opacity: 1;
                    transform: translateX(-4px);
                }
            `}</style>
        </div>
    );
}
