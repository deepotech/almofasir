import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container" suppressHydrationWarning>
                <div className="footer-grid" suppressHydrationWarning>
                    {/* Brand */}
                    <div className="footer-brand" suppressHydrationWarning>
                        <Link href="/" className="logo">
                            <div className="logo-icon" suppressHydrationWarning>🌙</div>
                            <span>المُفسِّر</span>
                        </Link>
                        <p className="footer-desc">
                            منصة تفسير الأحلام الأولى عربياً - نجمع بين الذكاء الاصطناعي والخبرة البشرية
                            لتقديم تفسيرات دقيقة مستندة إلى تراث ابن سيرين والنابلسي.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div suppressHydrationWarning>
                        <h4 className="footer-title">روابط سريعة</h4>
                        <ul className="footer-links">
                            <li><Link href="/">الرئيسية</Link></li>
                            <li><Link href="/pricing">الأسعار والباقات</Link></li>
                            <li><Link href="/symbols">قاموس تفسير الأحلام</Link></li>
                            <li><Link href="/journal">سجل أحلامي</Link></li>
                            <li><Link href="/learn">تعلّم</Link></li>
                            <li><Link href="/experts">المفسرون</Link></li>
                        </ul>
                    </div>

                    {/* Educational */}
                    <div suppressHydrationWarning>
                        <h4 className="footer-title">تعلّم</h4>
                        <ul className="footer-links">
                            <li><Link href="/learn/faq">الأسئلة الشرعية</Link></li>
                            <li><Link href="/learn/psychology">علم النفس والأحلام</Link></li>
                            <li><Link href="/learn/videos">فيديوهات قصيرة</Link></li>
                            <li><Link href="/learn/articles">مقالات</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div suppressHydrationWarning>
                        <h4 className="footer-title">الدعم</h4>
                        <ul className="footer-links">
                            <li><Link href="/contact">تواصل معنا</Link></li>
                            <li><Link href="/privacy">سياسة الخصوصية</Link></li>
                            <li><Link href="/terms">شروط الاستخدام</Link></li>
                            <li><Link href="/about">من نحن</Link></li>
                            <li><Link href="/join" className="text-amber-500">انضم كمفسّر</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="disclaimer" suppressHydrationWarning>
                    <div className="disclaimer-icon" suppressHydrationWarning>⚠️</div>
                    <p className="disclaimer-text">
                        <strong>إخلاء مسؤولية:</strong> التفسيرات المقدمة في هذا الموقع هي للاستئناس والتأمل فقط،
                        وليست أحكاماً شرعية قاطعة أو تنبؤات غيبية. لا يعلم الغيب إلا الله،
                        ونوصي بعدم بناء قرارات حياتية مهمة على تفسيرات الأحلام.
                        للاستشارات الشرعية، يُرجى التوجه لأهل العلم المختصين.
                    </p>
                </div>

                <div className="footer-bottom" suppressHydrationWarning>
                    <p>© {new Date().getFullYear()} المُفسِّر - جميع الحقوق محفوظة</p>
                    <p className="mt-sm" style={{ fontSize: 'var(--text-xs)' }}>
                        "الرُّؤْيَا الصَّالِحَةُ مِنَ اللَّهِ، وَالْحُلُمُ مِنَ الشَّيْطَانِ" - حديث شريف
                    </p>
                </div>
            </div>
        </footer>
    );
}
