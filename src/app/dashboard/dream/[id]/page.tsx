'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import RatingForm from '@/components/rating/RatingForm';

interface DreamSymbol {
    name: string;
    meaning: string;
}

interface DreamInterpretation {
    summary: string;
    symbols: DreamSymbol[];
    advice: string[];
    isPremium: boolean;
    aiGenerated?: boolean;
    humanResponse?: string;
}

interface UserFeedback {
    liked: boolean | null;
    cameTrue: boolean | null;
}

interface Dream {
    _id: string;
    title: string;
    content: string;
    interpretation: DreamInterpretation | null;
    interpreter: string;
    mood: string;
    tags: string[];
    userFeedback?: UserFeedback;
    rating?: number;
    ratingFeedback?: string;
    createdAt: string;
}

export default function DreamDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [dream, setDream] = useState<Dream | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState<UserFeedback>({ liked: null, cameTrue: null });
    const [feedbackSaving, setFeedbackSaving] = useState(false);

    const moodLabels: Record<string, string> = {
        happy: '😊 سعيد',
        sad: '😢 حزين',
        anxious: '😟 قلق',
        confused: '🤔 محتار',
        neutral: '😐 محايد'
    };

    useEffect(() => {
        const fetchDream = async () => {
            if (!user) return;

            try {
                const token = await user.getIdToken();
                const response = await fetch(`/api/dreams/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('فشل في جلب بيانات الحلم');
                }

                const data = await response.json();
                setDream(data.dream);
                // Initialize feedback from dream data
                if (data.dream.userFeedback) {
                    setFeedback(data.dream.userFeedback);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
            } finally {
                setLoading(false);
            }
        };

        fetchDream();
    }, [id, user]);

    // Save feedback to database
    const saveFeedback = async (newFeedback: Partial<UserFeedback>) => {
        if (!user || !dream) return;

        setFeedbackSaving(true);
        const updatedFeedback = { ...feedback, ...newFeedback };
        setFeedback(updatedFeedback);

        try {
            const token = await user.getIdToken();
            await fetch(`/api/dreams/${id}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedFeedback)
            });
        } catch (err) {
            console.error('Failed to save feedback:', err);
        } finally {
            setFeedbackSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="details-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>جاري تحميل تفاصيل الحلم...</p>
                </div>
                <style jsx>{styles}</style>
            </div>
        );
    }

    if (error || !dream) {
        return (
            <div className="details-container">
                <div className="error-state">
                    <p>❌ {error || 'لم يتم العثور على الحلم'}</p>
                    <button onClick={() => router.back()} className="btn-back">
                        العودة
                    </button>
                </div>
                <style jsx>{styles}</style>
            </div>
        );
    }

    return (
        <div className="details-container">
            <button onClick={() => router.back()} className="btn-back">
                → العودة للسجل
            </button>

            <div className="dream-header">
                <div className="meta-row">
                    <span className="date">
                        {new Date(dream.createdAt).toLocaleDateString('ar-SA', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </span>
                    <span className="mood-badge">{moodLabels[dream.mood] || dream.mood}</span>
                </div>
                <h1 className="title">{dream.title || 'حلم بدون عنوان'}</h1>
            </div>

            <div className="section">
                <h2>📝 نص الحلم</h2>
                <p className="dream-text">{dream.content}</p>
            </div>

            {dream.interpretation && (
                <div className="section interpretation-section">
                    <h2>📖 التفسير</h2>
                    <div className="interpreter-info">
                        <span>المفسر: {dream.interpreter || 'ابن سيرين'}</span>
                        {dream.interpretation.aiGenerated && (
                            <span className="ai-badge">🤖 تفسير آلي</span>
                        )}
                    </div>

                    {dream.interpretation.summary && (
                        <div className="interpretation-summary">
                            <h3>ملخص التفسير</h3>
                            <p>{dream.interpretation.summary}</p>
                        </div>
                    )}

                    {dream.interpretation.symbols && dream.interpretation.symbols.length > 0 && (
                        <div className="symbols-section">
                            <h3>🔮 الرموز ومعانيها</h3>
                            <div className="symbols-list">
                                {dream.interpretation.symbols.map((symbol, index) => (
                                    <div key={index} className="symbol-item">
                                        <span className="symbol-name">{symbol.name}</span>
                                        <span className="symbol-meaning">{symbol.meaning}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {dream.interpretation.advice && dream.interpretation.advice.length > 0 && (
                        <div className="advice-section">
                            <h3>💡 النصائح</h3>
                            <ul className="advice-list">
                                {dream.interpretation.advice.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {dream.interpretation.humanResponse && (
                        <div className="human-review">
                            <h3>👤 تفسير المفسر البشري</h3>
                            <p>{dream.interpretation.humanResponse}</p>
                        </div>
                    )}
                </div>
            )}

            {dream.tags && dream.tags.length > 0 && (
                <div className="section">
                    <h2>🏷️ الوسوم</h2>
                    <div className="tags-grid">
                        {dream.tags.map((tag, index) => (
                            <span key={index} className="tag-item">{tag}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Feedback Section */}
            <div className="section">
                <h2>💬 رأيك في التفسير</h2>
                <div className="feedback-section">
                    <div className="feedback-group">
                        <span className="feedback-label">هل أعجبك التفسير؟</span>
                        <div className="feedback-buttons">
                            <button
                                className={`feedback-btn ${feedback.liked === true ? 'active-positive' : ''}`}
                                onClick={() => saveFeedback({ liked: true })}
                                disabled={feedbackSaving}
                            >
                                👍 نعم
                            </button>
                            <button
                                className={`feedback-btn ${feedback.liked === false ? 'active-negative' : ''}`}
                                onClick={() => saveFeedback({ liked: false })}
                                disabled={feedbackSaving}
                            >
                                👎 لا
                            </button>
                        </div>
                    </div>
                    <div className="feedback-group">
                        <span className="feedback-label">هل تحقق الحلم؟</span>
                        <div className="feedback-buttons">
                            <button
                                className={`feedback-btn ${feedback.cameTrue === true ? 'active-positive' : ''}`}
                                onClick={() => saveFeedback({ cameTrue: true })}
                                disabled={feedbackSaving}
                            >
                                ✅ تحقق
                            </button>
                            <button
                                className={`feedback-btn ${feedback.cameTrue === false ? 'active-negative' : ''}`}
                                onClick={() => saveFeedback({ cameTrue: false })}
                                disabled={feedbackSaving}
                            >
                                ❌ لم يتحقق
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Star Rating Section */}
            {dream.interpretation && (
                <div className="section">
                    <RatingForm
                        orderId={dream._id}
                        apiEndpoint={`/api/dreams/${dream._id}/rate`}
                        existingRating={dream.rating}
                        existingFeedback={dream.ratingFeedback}
                        onRatingSubmitted={(rating) => setDream(prev => prev ? { ...prev, rating } : null)}
                        getToken={() => user!.getIdToken()}
                    />
                </div>
            )}

            <style jsx>{styles}</style>
        </div>
    );
}

const styles = `
    .details-container {
        max-width: 800px;
        margin: 0 auto;
        padding: var(--spacing-xl);
    }

    .loading-state, .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        gap: var(--spacing-md);
        color: var(--color-text-secondary);
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-top-color: var(--color-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .btn-back {
        background: transparent;
        border: 1px solid var(--color-border);
        color: var(--color-text-secondary);
        padding: 0.5rem 1rem;
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: var(--spacing-lg);
    }

    .btn-back:hover {
        border-color: var(--color-primary);
        color: var(--color-primary);
    }

    .dream-header {
        margin-bottom: var(--spacing-xl);
    }

    .meta-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md);
        flex-wrap: wrap;
        gap: var(--spacing-sm);
    }

    .date {
        color: var(--color-text-secondary);
        font-size: 0.9rem;
    }

    .mood-badge {
        background: rgba(255, 255, 255, 0.05);
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.85rem;
    }

    .title {
        font-size: 1.8rem;
        color: var(--color-text-primary);
        margin: 0;
        font-weight: 600;
    }

    .section {
        background: var(--color-bg-secondary);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        margin-bottom: var(--spacing-lg);
    }

    .section h2 {
        font-size: 1.1rem;
        color: var(--color-text-primary);
        margin: 0 0 var(--spacing-md);
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
    }

    .section h3 {
        font-size: 1rem;
        color: var(--color-text-primary);
        margin: var(--spacing-md) 0 var(--spacing-sm);
    }

    .dream-text {
        color: var(--color-text-secondary);
        line-height: 1.8;
        margin: 0;
        white-space: pre-wrap;
    }

    .interpretation-section {
        border-color: var(--color-primary);
        border-width: 1px;
    }

    .interpreter-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.85rem;
        color: var(--color-primary);
        margin-bottom: var(--spacing-md);
        opacity: 0.8;
        flex-wrap: wrap;
        gap: var(--spacing-sm);
    }

    .ai-badge {
        background: rgba(var(--color-primary-rgb), 0.1);
        padding: 0.25rem 0.5rem;
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
    }

    .interpretation-summary p {
        color: var(--color-text-primary);
        line-height: 1.8;
        margin: 0;
        white-space: pre-wrap;
    }

    .symbols-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
    }

    .symbol-item {
        display: flex;
        gap: var(--spacing-md);
        padding: var(--spacing-sm);
        background: rgba(255, 255, 255, 0.02);
        border-radius: var(--radius-sm);
    }

    .symbol-name {
        font-weight: 600;
        color: var(--color-primary);
        min-width: 100px;
    }

    .symbol-meaning {
        color: var(--color-text-secondary);
        flex: 1;
    }

    .advice-list {
        color: var(--color-text-secondary);
        padding-right: var(--spacing-lg);
        margin: 0;
        line-height: 1.8;
    }

    .advice-list li {
        margin-bottom: var(--spacing-xs);
    }

    .human-review {
        margin-top: var(--spacing-lg);
        padding-top: var(--spacing-lg);
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .human-review p {
        color: var(--color-text-primary);
        line-height: 1.8;
        margin: 0;
    }

    .tags-grid {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-sm);
    }

    .tag-item {
        background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
        color: var(--color-bg-primary);
        padding: 0.4rem 0.8rem;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
    }

    .feedback-section {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xl);
    }

    .feedback-group {
        flex: 1;
        min-width: 200px;
    }

    .feedback-label {
        display: block;
        color: var(--color-text-secondary);
        margin-bottom: var(--spacing-sm);
        font-size: 0.9rem;
    }

    .feedback-buttons {
        display: flex;
        gap: var(--spacing-sm);
    }

    .feedback-btn {
        flex: 1;
        padding: 0.6rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--radius-md);
        color: var(--color-text-secondary);
        font-family: var(--font-arabic);
        cursor: pointer;
        transition: all 0.2s;
    }

    .feedback-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
        border-color: var(--color-primary);
        color: var(--color-text-primary);
    }

    .feedback-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .feedback-btn.active-positive {
        background: #22c55e;
        border-color: #22c55e;
        color: white;
    }

    .feedback-btn.active-negative {
        background: #ef4444;
        border-color: #ef4444;
        color: white;
    }
`;
