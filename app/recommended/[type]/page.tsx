import { RecommendedClient } from './RecommendedClient';

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }) {
  const resolvedParams = await params;
  const titles: Record<string, string> = {
    'movie': 'Recommended Movies',
    'tv': 'Recommended TV Shows',
    'all': 'Recommended For You'
  };
  
  return {
    title: titles[resolvedParams.type] || titles['all'],
    robots: { index: false, follow: false },
  };
}

export default async function RecommendedPage({ params }: { params: Promise<{ type: string }> }) {
  const resolvedParams = await params;
  const type = ['movie', 'tv', 'all'].includes(resolvedParams.type) ? resolvedParams.type as 'movie' | 'tv' | 'all' : 'all';

  return (
    <div className="flex flex-col min-h-screen w-full bg-black -mt-[72px]">
      <RecommendedClient mediaType={type} />
    </div>
  );
}
