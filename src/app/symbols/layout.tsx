import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "قاموس تفسير الأحلام بالحروف | مكتبة الرموز الشاملة - المفسر",
    description: "استعرض قاموس تفسير الأحلام الشامل بالحروف. ابحث عن رموز أحلامك واعرف معناها بالتفصيل وفق منهج ابن سيرين والنابلسي. مكتبة متكاملة لرموز الرؤى.",
    keywords: "قاموس تفسير الأحلام بالحروف, رموز الأحلام, معاني الأحلام, تفسير الأحلام حسب الحرف, البحث في الأحلام, رموز الرؤيا",
    openGraph: {
        title: "قاموس تفسير الأحلام بالحروف | مكتبة الرموز - المفسر",
        description: "ابحث عن أي رمز في حلمك واعرف تفسيره فوراً. أكبر قاموس لتفسير الأحلام مرتب أبجدياً.",
        url: "https://almofasser.com/symbols",
    },
};

export default function SymbolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
