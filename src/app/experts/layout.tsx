import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "أشهر مفسري الأحلام | ابن سيرين، النابلسي، والمزيد - المفسر",
    description: "تعرف على سير ومنهجيات أشهر مفسري الأحلام في التاريخ الإسلامي. تفسير حلمك بمنهج ابن سيرين، النابلسي، ابن شاهين، وغيرهم من العلماء الثقات.",
    keywords: "تفسير أحلام ابن سيرين, النابلسي, ابن شاهين, مفسرين, علماء التفسير, منهج تفسير الأحلام",
    openGraph: {
        title: "أشهر مفسري الأحلام ومنهجياتهم - المفسر",
        description: "موسوعة شاملة عن علماء تفسير الأحلام الكلاسيكيين. اختر المفسر الذي تثق به.",
        url: "https://almofasser.com/experts",
    },
};

export default function ExpertsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
