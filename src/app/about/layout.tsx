import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "من نحن | موقع المفسر - الريادة في تفسير الأحلام بالذكاء الاصطناعي",
    description: "المفسر هي المنصة العربية الأولى التي تدمج بين أصالة التفسير الشرعي ودقة الذكاء الاصطناعي. نعرفك بفريقنا، رؤيتنا، وقيمنا في تقديم تفسير أحلام موثوق وآمن.",
    keywords: "موقع تفسير الأحلام, عن المفسر, من نحن, فريق المفسر, رؤية المفسر, مصداقية تفسير الأحلام",
    openGraph: {
        title: "من نحن | موقع المفسر لتفسير الأحلام",
        description: "تعرف على الفريق خلف منصة المفسر ورسالتنا في إحياء علم تعبير الرؤى بتقنيات المستقبل.",
        url: "https://almofasser.com/about",
    },
};

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
