import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// Educational content data
const articles = [
    {
        id: 'dream-vs-vision',
        title: 'الفرق بين الرؤيا والحلم',
        category: 'شرعي',
        excerpt: 'تعرف على الفرق الشرعي بين الرؤيا الصادقة من الله والحلم من الشيطان وحديث النفس.',
        icon: '📜',
    },
    {
        id: 'etiquette',
        title: 'آداب النوم والاستيقاظ',
        category: 'شرعي',
        excerpt: 'الأذكار والأدعية المستحبة قبل النوم وعند الاستيقاظ من الحلم.',
        icon: '🌙',
    },
    {
        id: 'bad-dreams',
        title: 'كيفية التعامل مع الأحلام المزعجة',
        category: 'شرعي',
        excerpt: 'ماذا تفعل عند رؤية حلم مزعج؟ الهدي النبوي في التعامل مع الأحلام السيئة.',
        icon: '😰',
    },
    {
        id: 'freud-jung',
        title: 'نظريات فرويد ويونغ في تفسير الأحلام',
        category: 'نفسي',
        excerpt: 'مقدمة مبسطة لأشهر نظريات علم النفس في تفسير الأحلام.',
        icon: '🧠',
    },
    {
        id: 'symbols-psychology',
        title: 'الرموز والعقل الباطن',
        category: 'نفسي',
        excerpt: 'كيف يعبر العقل الباطن عن مشاعرنا من خلال رموز الأحلام.',
        icon: '💭',
    },
    {
        id: 'recurring-dreams',
        title: 'الأحلام المتكررة ومعناها',
        category: 'نفسي',
        excerpt: 'لماذا نرى نفس الحلم مراراً؟ وما الرسائل التي يحملها؟',
        icon: '🔄',
    },
];

const videos = [
    { title: 'تفسير رؤية الماء في المنام', views: '120K', duration: '2:30' },
    { title: 'رؤية الأفعى والثعبان', views: '95K', duration: '3:15' },
    { title: 'الطيران والسقوط في الحلم', views: '78K', duration: '2:45' },
    { title: 'رؤية الميت في المنام', views: '150K', duration: '4:00' },
];

export default function LearnPage() {
    return (
        <>
            <Header />

            <main style={{ paddingTop: 100 }}>
                {/* Hero */}
                <section className="section">
                    <div className="container text-center">
                        <h1 className="mb-md">📚 تعلّم وافهم أحلامك</h1>
                        <p className="text-muted" style={{ maxWidth: 600, margin: '0 auto' }}>
                            محتوى تعليمي شامل يجمع بين التفسير الشرعي وعلم النفس الحديث
                        </p>
                    </div>
                </section>

                {/* Quick Links */}
                <section className="section" style={{ paddingTop: 0 }}>
                    <div className="container">
                        <div className="flex justify-center gap-xl" style={{ flexWrap: 'wrap' }}>
                            <Link href="/learn/faq" className="glass-card text-center" style={{ minWidth: 200, padding: 'var(--spacing-xl)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📜</div>
                                <h4>الأسئلة الشرعية</h4>
                                <p className="text-muted text-sm mt-sm">أحكام وآداب الرؤى</p>
                            </Link>
                            <Link href="/learn/psychology" className="glass-card text-center" style={{ minWidth: 200, padding: 'var(--spacing-xl)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>🧠</div>
                                <h4>علم النفس</h4>
                                <p className="text-muted text-sm mt-sm">فهم الذات عبر الأحلام</p>
                            </Link>
                            <Link href="/learn/videos" className="glass-card text-center" style={{ minWidth: 200, padding: 'var(--spacing-xl)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>🎬</div>
                                <h4>فيديوهات قصيرة</h4>
                                <p className="text-muted text-sm mt-sm">تفسير الرموز الشائعة</p>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Articles Grid */}
                <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
                    <div className="container">
                        <h2 className="text-center mb-2xl">📖 مقالات مميزة</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-xl)' }}>
                            {articles.map(article => (
                                <article key={article.id} className="card">
                                    <div className="flex gap-md items-center mb-md">
                                        <span style={{ fontSize: '2rem' }}>{article.icon}</span>
                                        <span className="tag">{article.category}</span>
                                    </div>
                                    <h4 className="mb-sm">{article.title}</h4>
                                    <p className="text-muted text-sm mb-lg">{article.excerpt}</p>
                                    <Link href={`/learn/${article.id}`} className="btn btn-ghost btn-sm">
                                        اقرأ المزيد ←
                                    </Link>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Videos Section */}
                <section className="section">
                    <div className="container">
                        <h2 className="text-center mb-xl">🎬 فيديوهات قصيرة</h2>
                        <p className="text-center text-muted mb-2xl">تفسير الرموز الشائعة بطريقة جذابة ومبسطة</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
                            {videos.map((video, idx) => (
                                <div key={idx} className="card" style={{ background: 'var(--gradient-card)' }}>
                                    <div style={{
                                        background: 'var(--color-bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        height: 150,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: 'var(--spacing-md)'
                                    }}>
                                        <span style={{ fontSize: '3rem', opacity: 0.5 }}>▶️</span>
                                    </div>
                                    <h5>{video.title}</h5>
                                    <div className="flex justify-between mt-sm text-muted text-sm">
                                        <span>👁️ {video.views}</span>
                                        <span>⏱️ {video.duration}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
                    <div className="container text-center">
                        <div className="glass-card" style={{ maxWidth: 600, margin: '0 auto' }}>
                            <h3 className="mb-md">🌟 هل لديك سؤال شرعي عن الأحلام؟</h3>
                            <p className="text-muted mb-xl">أرسل سؤالك وسيجيب عليه متخصصون في العقيدة</p>
                            <Link href="/learn/faq" className="btn btn-secondary">
                                اسأل سؤالك ←
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
