/**
 * Fallback Data for when MongoDB is down and Cache is empty.
 * Guarantees zero blank UI screens.
 */

import { humanInterpreters } from '@/data/human_interpreters';

export const fallbackDreams = [
    {
        id: 'fallback-dream-1',
        slug: 'tafsir-halm-al-bahr-123456',
        title: 'تفسير حلم رؤية البحر الهادئ والصافي',
        content: 'رأيت في المنام أنني أقف أمام بحر هادئ جداً ومياهه صافية وصوته يبعث على الراحة.',
        interpretation: 'البحر الهادئ في المنام يرمز إلى استقرار الحياة والسكينة النفسية التي تعيشها أو ستقبل عليها قريباً بإذن الله.',
        mood: 'happy',
        date: new Date().toISOString(),
        tags: ['البحر', 'السكينة', 'الاستقرار']
    },
    {
        id: 'fallback-dream-2',
        slug: 'tafsir-halm-al-sayara-123457',
        title: 'تفسير حلم قيادة سيارة جديدة بسرعة',
        content: 'رأيت أنني أقود سيارة بيضاء جديدة بسرعة في طريق واسع ومفتوح بدون عوائق.',
        interpretation: 'قيادة السيارة تعكس مسارك في الحياة. السرعة في طريق مفتوح تدل على طموحك العالي وسرعة تحقيق أهدافك القادمة.',
        mood: 'happy',
        date: new Date(Date.now() - 86400000).toISOString(),
        tags: ['السيارة', 'القيادة', 'السرعة']
    },
    {
        id: 'fallback-dream-3',
        slug: 'tafsir-halm-al-tayaran-123458',
        title: 'تفسير حلم الطيران في السماء بدون أجنحة',
        content: 'حلمت أنني أطير في السماء بكل خفة وبدون أجنحة وشعرت بحرية كبيرة أثناء الطيران فوق السحاب.',
        interpretation: 'الطيران المريح يرمز إلى الرفعة والنجاح. شعورك بالحرية يعني تخلصك من قيود أو هموم كانت تثقل كاهلك.',
        mood: 'happy',
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        tags: ['الطيران', 'الحرية', 'النجاح']
    }
];

export const fallbackDreamDetails = {
    _id: 'fallback-dream-1',
    seoSlug: 'tafsir-halm-al-bahr-123456',
    title: 'تفسير رؤية البحر في المنام (نسخة مؤرشفة)',
    content: 'هذه نسخة مؤرشفة ومثبتة من تفسير رؤية البحر في المنام بسبب ضغط مؤقت على الخوادم.',
    mood: 'happy',
    tags: ['البحر', 'السكينة'],
    visibilityStatus: 'public',
    publicVersion: {
        title: 'تفسير حلم رؤية البحر الهادئ',
        content: 'هذه نسخة محفوظة ومؤقتة تعمل حينما تكون هناك صيانة للسيرفرات أو ضغط عالي.',
        seoIntro: 'البحر من الرموز العظيمة في المنام وتدل على سعة الرزق والاستقرار النفسي.',
        publishedAt: new Date().toISOString(),
        comprehensiveInterpretation: {
            primarySymbol: 'البحر',
            h1: 'تفسير حلم رؤية البحر الهادئ',
            metaTitle: 'تفسير حلم البحر - مقال مؤقت',
            metaDescription: 'شرح مفصل لرؤية البحر الهادئ في المنام.',
            snippetSummary: 'البحر يرمز للسلطان أو الحياة الدنيا، وهدوءه يرمز للراحة.',
            sections: [
                {
                    heading: 'معنى الحلم بشكل عام',
                    content: 'البحر الهادئ يعبر عادة عن الهدوء النفسي والاستقرار الذي يأتي بعد فترة من التعب أو القلق.'
                },
                {
                    heading: 'تفسير تفصيلي للأحداث',
                    content: 'بما أنك رأيت المياف صافية فهذا يعني وضوح النوايا وصفاء الذهن.'
                }
            ],
            faqs: [
                {
                    question: 'هل البحر الهادئ دائماً بشارة خير؟',
                    answer: 'نعم، في أغلب التأويلات يعتبر البحر الهادئ والصافي إشارة محمودة.'
                }
            ]
        }
    }
};

export const fallbackInterpreters = humanInterpreters.map((i: any) => ({
    id: i.id || 'fallback-int',
    displayName: i.name,
    avatar: i.avatar,
    bio: i.bio,
    interpretationType: i.type || 'mixed',
    interpretationTypeAr: i.type === 'religious' ? 'شرعي' : 'شامل',
    price: i.price,
    responseTime: i.responseSpeed === '6h' ? 6 : 24,
    responseTimeText: i.responseSpeed === '6h' ? 'خلال 6 ساعات' : 'خلال 24 ساعة',
    rating: i.rating || 5,
    totalRatings: i.reviewsCount || 10,
    completedDreams: i.completedDreams || 100,
    isActive: true,
    status: 'online'
}));
