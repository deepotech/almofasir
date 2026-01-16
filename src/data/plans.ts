export type PlanType = 'one-time' | 'subscription';

export interface PlanFeature {
    text: string;
    included: boolean;
}

export interface Plan {
    id: string;
    name: string;
    price: string;
    originalPrice?: string; // For strikethrough if needed
    period: string;
    type: PlanType;
    description: string;
    highlight?: string; // "Recommended" badge text
    features: PlanFeature[];
    isPopular?: boolean;
    buttonText: string;
    credits: {
        ai: number;
        human: number;
    };
}

export const PLANS: Plan[] = [
    {
        id: 'basic-credit',
        name: 'تفسير واحد',
        price: '2.99',
        period: 'للمرة الواحدة',
        type: 'one-time',
        description: 'مناسب للتجربة السريعة',
        buttonText: 'تفسير واحد فقط',
        credits: { ai: 1, human: 0 },
        features: [
            { text: 'تفسير حلم واحد', included: true },
            { text: 'تحليل الرموز الأساسية', included: true },
            { text: 'حفظ في السجل', included: true },
            { text: 'اختيار المفسر', included: false },
        ]
    },
    {
        id: 'pro-monthly',
        name: 'اشتراك شهري',
        price: '9.99',
        period: 'شهرياً',
        type: 'subscription',
        description: 'الأفضل للمهتمين بعالم الأحلام',
        highlight: 'الخيار المفضل',
        isPopular: true,
        buttonText: 'الاستمرار مع الذكاء الاصطناعي',
        credits: { ai: 10, human: 0 },
        features: [
            { text: '10 تفسيرات بالذكاء الاصطناعي', included: true },
            { text: 'اختيار المفسر (ابن سيرين / النابلسي)', included: true },
            { text: 'سجل كامل للأحلام', included: true },
            { text: 'أولوية في التحليل', included: true },
        ]
    },
    {
        id: 'human-expert',
        name: 'مفسر حقيقي',
        price: '14.99',
        period: 'للحلم الواحد',
        type: 'one-time',
        description: 'رأي بشري من عالم متخصص',
        buttonText: 'طلب مفسر حقيقي',
        credits: { ai: 0, human: 1 },
        features: [
            { text: 'تفسير من عالم متخصص', included: true },
            { text: 'الرد خلال 24-48 ساعة', included: true },
            { text: 'إجابة دقيقة على استفساراتك', included: true },
            { text: 'مراعاة السياق الشخصي والشرعي', included: true },
        ]
    }
];
