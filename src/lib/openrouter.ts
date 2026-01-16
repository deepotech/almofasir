import OpenAI from 'openai';

const apiKey = process.env.OPENROUTER_API_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const siteName = 'Almofasser';

if (!apiKey) {
    console.warn('OPENROUTER_API_KEY is not defined in .env.local');
}

export const openRouter = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: apiKey,
    defaultHeaders: {
        'HTTP-Referer': siteUrl,
        'X-Title': siteName,
    },
    dangerouslyAllowBrowser: true, // Be careful with this in production, better to use server-side only
});

export const getInterpretation = async (dreamText: string, context?: string) => {
    try {
        const completion = await openRouter.chat.completions.create({
            model: 'openai/gpt-3.5-turbo', // Or any other model supported by OpenRouter
            messages: [
                {
                    role: 'system',
                    content: `أنت مفسر أحلام خبير يجمع بين التراث الإسلامي (ابن سيرين، النابلسي) وعلم النفس الحديث. 
          قم بتحليل الحلم التالي واستخرج الرموز الأساسية، وقدم تفسيراً متزناً ومبشراً.
          السياق: ${context || 'عام'}`,
                },
                {
                    role: 'user',
                    content: dreamText,
                },
            ],
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error fetching interpetation:', error);
        throw error;
    }
};
