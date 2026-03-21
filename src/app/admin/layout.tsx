import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'لوحة تحكم الإدارة | المفسر',
    robots: {
        index: false,
        follow: false,
    },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
