export interface HumanInterpreter {
    id: string;
    name: string;
    slug: string; // for SEO friendly URLs if needed later
    title: string;
    bio: string;
    isVerified: boolean;
    isExpert: boolean;
    rating: number;
    reviewsCount: number;
    completedDreams: number;
    responseSpeed: '24h' | '48h' | '6h'; // Speed options
    price: number;
    currency: string;
    avatar: string; // Path to image or emoji for now
    types: ('religious' | 'psychological' | 'symbolic')[];
    status: 'available' | 'busy' | 'offline';
}

export const humanInterpreters: HumanInterpreter[] = [
    {
        id: 'int_001',
        name: 'الشيخ أبو مالك المرسلي',
        slug: 'abu-malik',
        title: 'مفسر رؤى شرعي ونفسي',
        bio: 'خبرة 15 عاماً في التفسير الشرعي المقارن، مع مراعاة الحالة النفسية للرائي. متخصص في الرموز المعقدة.',
        isVerified: true,
        isExpert: true,
        rating: 4.9,
        reviewsCount: 342,
        completedDreams: 1540,
        responseSpeed: '24h',
        price: 49,
        currency: '$',
        avatar: '/cv.png', // Using the existing image we saw in home page
        types: ['religious', 'psychological'],
        status: 'available'
    },
    {
        id: 'int_002',
        name: 'د. سارة الأحمد',
        slug: 'sara-ahmad',
        title: 'أخصائية نفسية ومفسرة',
        bio: 'تفسير الأحلام من منظور التحليل النفسي الحديث (مدرسة يونغ) مع الربط بالواقع الحياتي.',
        isVerified: true,
        isExpert: false,
        rating: 4.8,
        reviewsCount: 120,
        completedDreams: 450,
        responseSpeed: '48h',
        price: 39,
        currency: '$',
        avatar: '👩‍⚕️',
        types: ['psychological'],
        status: 'available'
    },
    {
        id: 'int_003',
        name: 'الشيخ عبد الله',
        slug: 'abdullah',
        title: 'باحث في علم التعبير',
        bio: 'تفسير دقيق يعتمد على الكتاب والسنة، مع تبيان الرموز بوضوح واختصار.',
        isVerified: true,
        isExpert: false,
        rating: 4.7,
        reviewsCount: 89,
        completedDreams: 320,
        responseSpeed: '24h',
        price: 29,
        currency: '$',
        avatar: '🧔',
        types: ['religious'],
        status: 'available'
    },
    {
        id: 'int_004',
        name: 'أ. مريم العلي',
        slug: 'mariam-ali',
        title: 'مفسرة أحلام ومرشدة',
        bio: 'تفسير رمزي شامل يركز على الرسائل الإيجابية والتحذيرية في الرؤيا.',
        isVerified: true,
        isExpert: false,
        rating: 4.9,
        reviewsCount: 56,
        completedDreams: 180,
        responseSpeed: '6h',
        price: 79,
        currency: '$',
        avatar: '🧕',
        types: ['symbolic', 'religious'],
        status: 'available'
    },
    {
        id: 'int_005',
        name: 'د. كريم المصري',
        slug: 'karim-masri',
        title: 'استشاري نفسي',
        bio: 'تحليل الأحلام للكشف عن الضغوط النفسية والمكبوتات والمساعدة في فهم الذات.',
        isVerified: true,
        isExpert: true,
        rating: 5.0,
        reviewsCount: 42,
        completedDreams: 150,
        responseSpeed: '48h',
        price: 59,
        currency: '$',
        avatar: '👨‍⚕️',
        types: ['psychological', 'symbolic'],
        status: 'busy'
    }
];
