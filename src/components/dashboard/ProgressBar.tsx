
'use client';

interface ProgressBarProps {
    currentDreams: number;
    targetDreams?: number;
    streak?: number;
}

export default function ProgressBar({ currentDreams, targetDreams = 10, streak = 0 }: ProgressBarProps) {
    const progress = Math.min((currentDreams / targetDreams) * 100, 100);
    const isComplete = currentDreams >= targetDreams;

    return (
        <div className="progress-container">
            <div className="progress-header">
                <div className="progress-title">
                    <span className="progress-icon">🎯</span>
                    <span>تقدمك هذا الشهر</span>
                </div>
                <div className="progress-stats">
                    <span className="current">{currentDreams}</span>
                    <span className="divider">/</span>
                    <span className="target">{targetDreams} أحلام</span>
                </div>
            </div>

            <div className="progress-bar-wrapper">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${progress}%` }}
                >
                    {isComplete && <span className="complete-icon">✨</span>}
                </div>
            </div>

            <div className="progress-footer">
                <div className="streak-badge">
                    <span className="fire-icon">🔥</span>
                    <span>{streak} أيام متتالية</span>
                </div>
                <div className="points-badge">
                    <span className="star-icon">⭐</span>
                    <span>{currentDreams * 10} نقطة</span>
                </div>
            </div>

            <style jsx>{`
                .progress-container {
                    background: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.1) 0%, rgba(var(--color-secondary-rgb), 0.05) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: var(--radius-lg);
                    padding: var(--spacing-lg);
                    margin-bottom: var(--spacing-xl);
                }
                .progress-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--spacing-md);
                }
                .progress-title {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                    font-weight: 600;
                    color: var(--color-text-primary);
                }
                .progress-icon {
                    font-size: 1.2rem;
                }
                .progress-stats {
                    display: flex;
                    align-items: baseline;
                    gap: 4px;
                }
                .current {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--color-primary);
                }
                .divider {
                    color: var(--color-text-muted);
                }
                .target {
                    color: var(--color-text-secondary);
                    font-size: 0.9rem;
                }
                .progress-bar-wrapper {
                    height: 12px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    overflow: hidden;
                    position: relative;
                }
                .progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
                    border-radius: 6px;
                    transition: width 0.5s ease;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    padding-left: 8px;
                    min-width: 30px;
                }
                .complete-icon {
                    font-size: 0.8rem;
                }
                .progress-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: var(--spacing-md);
                }
                .streak-badge, .points-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    color: var(--color-text-secondary);
                }
                .fire-icon, .star-icon {
                    font-size: 1rem;
                }
                .streak-badge:hover, .points-badge:hover {
                    background: rgba(255, 255, 255, 0.08);
                }
            `}</style>
        </div>
    );
}
