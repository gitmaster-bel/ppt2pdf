import Link from 'next/link';
import { blogPosts } from '@/lib/blog';

export const metadata = {
  title: 'Blog',
  robots: { index: false, follow: false },
};

export default function BlogIndex() {
  return (
    <div className="flex flex-col min-h-screen pb-28 md:pb-20 pt-28 max-w-7xl mx-auto px-4 w-full">
      
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tighter text-white drop-shadow-xl mb-4">
          ZIVOX <span className="text-brand-500">Blog</span>
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
          Discover genuine articles, movie recommendations, and streaming guides.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogPosts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all">
            <div className="aspect-video relative overflow-hidden bg-zinc-800">
              <img 
                src={post.coverImage} 
                alt={post.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-500 bg-brand-500/10 px-2 py-1 rounded">
                  {post.tags[0]}
                </span>
                <span className="text-xs text-zinc-500 font-medium">
                  {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-brand-500 transition-colors line-clamp-2">
                {post.title}
              </h2>
              <p className="text-sm text-zinc-400 line-clamp-3 mb-4 flex-grow">
                {post.description}
              </p>
              <div className="text-xs font-bold text-zinc-500 mt-auto pt-4 border-t border-zinc-800/50 uppercase tracking-wide">
                By {post.author}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
