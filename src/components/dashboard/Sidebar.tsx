import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Home, BookOpen, Calendar, PieChart, Settings, Inbox, Banknote } from 'lucide-react'; // Assuming these icons are from lucide-react or similar

const dashboardItems = [
    { name: 'الرئيسية', icon: Home, href: '/dashboard' },
    { name: 'فسّر حلمك', icon: BookOpen, href: '/dashboard/new' },
    { name: 'أحلامي', icon: Inbox, href: '/dashboard/requests' },
    { name: 'المفسرون', icon: Calendar, href: '/experts', external: true },
    { name: 'الفواتير', icon: Banknote, href: '/dashboard/billing' },
    { name: 'الإعدادات', icon: Settings, href: '/dashboard/settings' },
];

const siteItems = [
    { name: 'الصفحة الرئيسية', icon: '🌐', href: '/' },
    { name: 'مكتبة الرموز', icon: '📚', href: '/symbols' },
    { name: 'المفسرين الكلاسيكيين', icon: '👨‍🏫', href: '/interpreters' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Link href="/" className="logo-text">
                    المُفسِّر
                </Link>
            </div>

            <div className="user-profile-summary">
                <div className="avatar-placeholder">
                    {user?.email?.[0].toUpperCase() || 'U'}
                </div>
                <div className="user-info">
                    <p className="user-name">{user?.displayName || 'مستخدم'}</p>
                    <p className="user-email">{user?.email}</p>
                </div>
            </div>

            {/* Admin Dashboard Link for Super User */}
            {user?.email === 'dev23hecoplus93mor@gmail.com' && (
                <Link href="/admin/dashboard" className="admin-btn">
                    <span>🛡️</span>
                    <span>لوحة الإدارة</span>
                </Link>
            )}

            {/* New Dream Button */}
            <Link href="/dashboard/new" className="new-dream-btn">
                <span>🌙</span>
                <span>فسّر حلم جديد</span>
            </Link>



            <nav className="sidebar-nav">
                <div className="nav-section-title">لوحة التحكم</div>
                {dashboardItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            target={(item as any).external ? '_blank' : undefined}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-icon"><item.icon size={20} /></span>
                            <span className="nav-text">{item.name}</span>
                        </Link>
                    );
                })}

                <div className="nav-divider"></div>

                <div className="nav-section-title">استكشف الموقع</div>
                {siteItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="nav-item"
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-text">{item.name}</span>
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="upgrade-banner">
                    <p>قم بالترقية للعضوية المميزة</p>
                    <button className="btn-upgrade">ترقية ✨</button>
                </div>
            </div>

            <style jsx>{`
                .sidebar {
                    width: 280px;
                    height: 100vh;
                    background: var(--color-bg-secondary);
                    border-left: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    flex-direction: column;
                    padding: var(--spacing-lg);
                    position: fixed;
                    right: 0;
                    top: 0;
                    z-index: 100;
                }

                .sidebar-header {
                    margin-bottom: var(--spacing-2xl);
                    text-align: center;
                }

                .logo-text {
                    font-family: var(--font-heading);
                    font-size: 1.5rem;
                    color: var(--color-primary);
                    font-weight: bold;
                    text-decoration: none;
                }

                .user-profile-summary {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-md);
                    padding: var(--spacing-md);
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: var(--radius-md);
                    margin-bottom: var(--spacing-xl);
                }

                .avatar-placeholder {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: var(--gradient-primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    color: white;
                }

                .user-info {
                    overflow: hidden;
                }

                .user-name {
                    font-weight: bold;
                    font-size: 0.9rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .user-email {
                    font-size: 0.75rem;
                    color: var(--color-text-secondary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .admin-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: var(--spacing-sm);
                    padding: var(--spacing-md);
                    background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
                    border-radius: var(--radius-md);
                    color: white;
                    text-decoration: none;
                    font-weight: bold;
                    margin-bottom: var(--spacing-md);
                    transition: all 0.2s;
                    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
                }

                .admin-btn:hover {
                    transform: scale(1.02);
                    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
                }

                .new-dream-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: var(--spacing-sm);
                    padding: var(--spacing-md);
                    background: var(--gradient-primary);
                    border-radius: var(--radius-md);
                    color: var(--color-bg-primary);
                    text-decoration: none;
                    font-weight: bold;
                    margin-bottom: var(--spacing-md); /* Reduced margin */
                    transition: all 0.2s;
                }

                .new-dream-btn:hover {
                    transform: scale(1.02);
                    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
                }

                .sidebar-nav {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-xs);
                    flex: 1;
                    overflow-y: auto;
                }

                .nav-section-title {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    color: var(--color-text-secondary);
                    padding: var(--spacing-sm) var(--spacing-md);
                    margin-top: var(--spacing-sm);
                }

                .nav-divider {
                    height: 1px;
                    background: rgba(255, 255, 255, 0.1);
                    margin: var(--spacing-md) 0;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-md);
                    padding: var(--spacing-md);
                    border-radius: var(--radius-md);
                    color: var(--color-text-secondary);
                    text-decoration: none;
                    transition: all 0.2s;
                }

                .nav-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--color-text-primary);
                    transform: translateX(-5px);
                }

                .nav-item.active {
                    background: rgba(212, 175, 55, 0.1); /* Gold tint */
                    color: var(--color-primary);
                    border-right: 3px solid var(--color-primary);
                }

                .upgrade-banner {
                    background: var(--gradient-secondary);
                    padding: var(--spacing-md);
                    border-radius: var(--radius-md);
                    text-align: center;
                    color: white;
                }

                .upgrade-banner p {
                    font-size: 0.85rem;
                    margin-bottom: var(--spacing-sm);
                }

                .btn-upgrade {
                    background: white;
                    color: var(--color-secondary);
                    border: none;
                    padding: 0.25rem 1rem;
                    border-radius: var(--radius-sm);
                    font-size: 0.8rem;
                    cursor: pointer;
                    font-weight: bold;
                }
            `}</style>
        </aside>
    );
}
