import { notFound } from 'next/navigation';
import { blogPosts, getBlogPostBySlug } from '@/lib/blog';
import { BackButton } from '@/components/ui/BackButton';

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  return {
    title: post ? post.title : 'Post Not Found',
    robots: { index: false, follow: false },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }


  return (
    <div className="flex flex-col min-h-screen pb-28 md:pb-20 pt-28 max-w-3xl mx-auto px-4 w-full">
      <div className="mb-8">
        <BackButton />
      </div>

      <article className="w-full">
        {/* Header */}
        <header className="mb-10 flex flex-col items-start text-left">
          <div className="flex items-center gap-3 mb-6">
            {post.tags.map((tag: string) => (
              <span key={tag} className="text-xs font-bold uppercase tracking-wider text-brand-500 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tighter text-white drop-shadow-xl mb-6 leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm font-medium text-zinc-400">
            <span className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-purple-500 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-brand-500/20">Z</span>
              {post.author}
            </span>
            <span>•</span>
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </time>
          </div>
        </header>

        {/* Cover Image */}
        <div className="w-full aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden mb-12 shadow-2xl shadow-black/50 border border-zinc-800 relative bg-zinc-900">
          <img 
            src={post.coverImage} 
            alt={post.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>

        {/* Content */}
        <div 
          className="prose prose-invert prose-brand max-w-none md:prose-lg 
                     prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight
                     prose-h2:text-3xl prose-h2:mt-14 prose-h2:mb-6 prose-h2:text-white
                     prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-4 prose-h3:text-zinc-200
                     prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:mb-8
                     prose-a:text-brand-500 prose-a:no-underline hover:prose-a:underline hover:prose-a:text-brand-400
                     prose-ul:text-zinc-300 prose-li:my-3
                     prose-blockquote:border-l-brand-500 prose-blockquote:bg-white/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:text-zinc-300 prose-blockquote:not-italic prose-blockquote:my-10
                     prose-hr:border-white/10 prose-hr:my-12
                     prose-strong:text-white prose-strong:font-bold"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}
