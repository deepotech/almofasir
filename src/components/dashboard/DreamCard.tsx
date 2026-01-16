
'use client';

import { useRouter } from 'next/navigation';

interface DreamProps {
    date: string;
    title: string;
    interpreter: string;
    preview: string;
    mood: string;
    id: string;
    tags?: string[];
    aiGenerated?: boolean;
    status?: 'completed' | 'pending' | 'reviewed';
}

// Map of tag categories with icons
const tagIcons: Record<string, string> = {
    'سفر': '🚶‍♂️',
    'زواج': '💍',
    'مال': '💰',
    'تحذير': '⚠️',
    'عمل': '💼',
    'صحة': '🏥',
    'عائلة': '👨‍👩‍👧‍👦',
    'موت': '⚰️',
    'حيوانات': '🐾',
    'ماء': '💧',
};

// Status labels and colors
const statusConfig = {
    'completed': { label: 'مكتمل', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
    'pending': { label: 'بانتظار المفسر', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    'reviewed': { label: 'تمت المراجعة', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' }
};

export default function DreamCard({ dream }: { dream: DreamProps }) {
    const router = useRouter();

    const moodIcons: Record<string, string> = {
        happy: '😊',
        sad: '😢',
        anxious: '😟',
        confused: '🤔',
        neutral: '😐'
    };

    // Default to some common tags if none provided (we can extract from content later)
    const displayTags = dream.tags?.slice(0, 3) || [];
    const status = dream.status || 'completed';
    const statusInfo = statusConfig[status];

    return (
        <div className="dream-card">
            <div className="card-header">
                <div className="date-badge">
                    {new Date(dream.date).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                </div>
                <div className="header-badges">
                    {/* Interpretation Type Badge */}
                    <div className={`type-badge ${dream.aiGenerated !== false ? 'ai' : 'human'}`}>
                        {dream.aiGenerated !== false ? '🤖 AI' : '👳‍♂️ مفسر'}
                    </div>
                    <div className="mood-icon">{moodIcons[dream.mood] || '😐'}</div>
                </div>
            </div>

            <div className="card-body">
                <h4 className="dream-title">{dream.title || 'حلم جديد'}</h4>
                <p className="dream-preview">
                    {(dream.preview || '').length > 80 ? (dream.preview || '').substring(0, 80) + '...' : (dream.preview || '...')}
                </p>

                {/* Tags Section */}
                {displayTags.length > 0 && (
                    <div className="tags-row">
                        {displayTags.map((tag, idx) => (
                            <span key={idx} className="tag-item">
                                {tagIcons[tag] || '🏷️'} {tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="meta-row">
                    <div className="interpreter-tag">
                        <span>📖 {dream.interpreter || 'ابن سيرين'}</span>
                    </div>
                    {/* Status Badge */}
                    <div
                        className="status-badge"
                        style={{
                            color: statusInfo.color,
                            background: statusInfo.bg
                        }}
                    >
                        {statusInfo.label}
                    </div>
                </div>
            </div>

            <div className="card-footer">
                <button className="btn-view" onClick={() => router.push(`/dashboard/requests/${dream.id}`)}>
                    عرض التفاصيل
                </button>
            </div>

            <style jsx>{`
                .dream-card {
                    background: var(--color-bg-secondary);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: var(--radius-lg);
                    padding: var(--spacing-lg);
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-md);
                    transition: all 0.25s ease;
                    position: relative;
                    overflow: hidden;
                }
                .dream-card:hover {
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    border-color: var(--color-primary);
                    transform: translateY(-2px);
                }
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .date-badge {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    color: var(--color-text-secondary);
                }
                .header-badges {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                }
                .type-badge {
                    padding: 0.2rem 0.5rem;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }
                .type-badge.ai {
                    background: rgba(var(--color-primary-rgb), 0.15);
                    color: var(--color-primary);
                }
                .type-badge.human {
                    background: rgba(245, 158, 11, 0.15);
                    color: #f59e0b;
                }
                .mood-icon {
                    font-size: 1.2rem;
                }
                .dream-title {
                    margin: 0 0 var(--spacing-sm);
                    font-size: 1.1rem;
                    color: var(--color-text-primary);
                    font-weight: 600;
                }
                .dream-preview {
                    color: var(--color-text-secondary);
                    font-size: 0.9rem;
                    line-height: 1.5;
                    margin: 0 0 var(--spacing-sm);
                }
                .tags-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-bottom: var(--spacing-sm);
                }
                .tag-item {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 0.2rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    color: var(--color-text-secondary);
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .meta-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: var(--spacing-xs);
                }
                .interpreter-tag {
                    font-size: 0.8rem;
                    color: var(--color-primary);
                    opacity: 0.8;
                }
                .status-badge {
                    padding: 0.2rem 0.5rem;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 500;
                }
                .card-footer {
                    margin-top: auto;
                }
                .btn-view {
                    width: 100%;
                    padding: 0.6rem;
                    background: transparent;
                    border: 1px solid var(--color-border);
                    color: var(--color-text-primary);
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: var(--font-arabic);
                    font-size: 0.9rem;
                }
                .btn-view:hover {
                    background: var(--color-primary);
                    border-color: var(--color-primary);
                    color: var(--color-bg-primary);
                }
            `}</style>
        </div>
    );
}
