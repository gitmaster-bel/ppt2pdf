import Link from 'next/link';
import { Shield, Zap, Monitor, Heart, Play, Search, Sparkles, Server } from 'lucide-react';

export const metadata = {
  title: 'About',
  robots: { index: false, follow: false },
};

const faqs = [
  {
    question: 'What is ZIVOX?',
    answer: 'ZIVOX is a free, premium streaming platform that lets you watch movies, TV shows, and anime in HD quality. It features a cinematic dark UI, multiple streaming servers, and requires no account or sign-up.',
  },
  {
    question: 'Is ZIVOX free to use?',
    answer: 'Yes, ZIVOX is completely free. There are no subscriptions, no hidden fees, and no account required. Just visit the site and start watching.',
  },
  {
    question: 'Does ZIVOX have ads or popups?',
    answer: 'ZIVOX itself has zero ads. The streaming sources are third-party embeds, and ZIVOX includes built-in Sandbox Protection and popup blocking to keep your experience clean and safe.',
  },
  {
    question: 'Is ZIVOX safe to use?',
    answer: 'ZIVOX includes multiple layers of protection: Sandbox Shield mode isolates embedded players, a popup interceptor blocks unwanted redirects, and a click shield prevents accidental ad clicks. Your browsing data stays local on your device.',
  },
  {
    question: 'What can I watch on ZIVOX?',
    answer: 'ZIVOX offers thousands of movies, TV shows, and anime series. Content is sourced from TMDB (The Movie Database) and streamed through 15+ independent streaming servers with automatic quality testing.',
  },
  {
    question: 'Does ZIVOX work on mobile?',
    answer: 'Yes, ZIVOX is fully mobile-optimized with a responsive design that works on phones, tablets, and desktops. It can also be installed as a Progressive Web App (PWA) on your home screen.',
  },
  {
    question: 'Does ZIVOX track my watch history?',
    answer: 'Yes, ZIVOX saves your watch history and progress locally in your browser. You can pick up where you left off, manage favorites, and get personalized recommendations — all without creating an account.',
  },
  {
    question: 'How does auto-play work on ZIVOX?',
    answer: 'When watching TV shows, ZIVOX automatically plays the next episode when the current one ends. You can toggle this feature on or off from the video player controls.',
  },
];

export default function AboutPage() {
  const features = [
    { icon: Server, title: '15+ Streaming Servers', desc: 'Automatic source testing finds the best quality stream with zero effort.' },
    { icon: Shield, title: 'Sandbox Protection', desc: 'Built-in security shields block popups, redirects, and malicious scripts.' },
    { icon: Play, title: 'Auto-Play Next', desc: 'Binge-watch seamlessly — next episode plays automatically when you finish.' },
    { icon: Heart, title: 'Favorites & History', desc: 'Save your favorite shows and pick up exactly where you left off.' },
    { icon: Monitor, title: 'Works Everywhere', desc: 'Fully responsive on phones, tablets, laptops, and TVs. Install as a PWA.' },
    { icon: Zap, title: 'Zero Ads', desc: 'No banner ads, no interstitials, no account walls. Just pure streaming.' },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-28 md:pb-20 pt-28 max-w-4xl mx-auto px-4 w-full">

      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-display font-black tracking-tighter text-white mb-6">
          About <span className="bg-gradient-to-r from-brand-500 to-purple-500 bg-clip-text text-transparent">ZIVOX</span>
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          ZIVOX is a free, premium streaming platform built for people who love movies, TV shows, and anime. 
          No accounts, no ads, no compromise — just a beautiful cinematic experience.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
        {features.map((f, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all group">
            <f.icon size={24} className="text-brand-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-2">{f.title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mb-16">
        <h2 className="text-2xl md:text-3xl font-display font-black tracking-tighter text-white mb-8 text-center">
          Frequently Asked Questions
        </h2>
        <div className="flex flex-col gap-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all">
              <summary className="cursor-pointer p-5 text-white font-semibold text-sm flex items-center justify-between list-none">
                {faq.question}
                <Sparkles size={16} className="text-zinc-500 group-open:text-brand-500 transition-colors flex-shrink-0 ml-4" />
              </summary>
              <div className="px-5 pb-5 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800/50 pt-4">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Legal & Contact Section */}
      <div className="mb-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
        <h2 className="text-2xl font-display font-black text-white mb-4">
          Disclaimer ◝(ᵔᵕᵔ)◜
        </h2>
        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
          Please note: ZIVOX does not host any files itself but instead only displays content from 3rd party providers. Legal issues should be taken up with them.
          <br /><br />
          ZIVOX does not host any media files, instead, it provides links to third-party services. Legal concerns regarding the files should be addressed directly with the respective file hosts and providers. ZIVOX bears no responsibility for the media files displayed by the providers.
        </p>

        <h2 className="text-2xl font-display font-black text-white mb-4">
          Contact Us
        </h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          For general inquiries, feature requests, or DMCA notices, please contact us at:<br/>
          <a href="mailto:zivox.tv@proton.me" className="text-brand-500 hover:text-brand-400 font-bold mt-2 inline-block">zivox.tv@proton.me</a>
        </p>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-premium-gradient hover:bg-premium-gradient-dark text-white font-bold px-8 py-3 rounded-full transition-all active:scale-95 shadow-lg shadow-brand-500/20"
        >
          <Play size={18} className="fill-white" /> Start Watching Now
        </Link>
      </div>
    </div>
  );
}
