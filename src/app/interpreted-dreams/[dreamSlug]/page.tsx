import { permanentRedirect } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ dreamSlug: string }> }) {
    const { dreamSlug } = await params;
    permanentRedirect(`/${dreamSlug}`);
}
