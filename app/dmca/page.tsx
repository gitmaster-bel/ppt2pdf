
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Mail, AlertTriangle, ExternalLink } from 'lucide-react';

export const metadata = {
  title: 'DMCA & Copyright Policy',
  robots: { index: false, follow: false },
};

export default function DmcaPage() {
  return (
    <div className="flex flex-col min-h-screen pb-28 md:pb-20 pt-28 max-w-4xl mx-auto px-4 w-full">
      
      {/* Header */}
      <div className="mb-12 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 text-brand-500 text-sm font-semibold mb-6 border border-brand-500/20">
          <ShieldAlert size={16} />
          Legal Policy
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-white mb-4">
          DMCA <span className="text-brand-500">Policy</span>
        </h1>
        <p className="text-zinc-400 font-mono text-sm">Last updated: June 2026</p>
      </div>

      <div className="space-y-8">
        
        {/* Important Disclaimer Card */}
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 md:p-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-premium-gradient"></div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-500/10 rounded-xl text-brand-500 shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2 font-display flex items-center gap-2">
                Disclaimer ◝(ᵔᵕᵔ)◜
              </h2>
              <p className="text-zinc-300 leading-relaxed text-sm md:text-base">
                Please note: <strong className="text-white">ZIVOX does not host any files itself</strong> but instead only displays content from 3rd party providers. Legal issues should be taken up with them.
                This site does not store any files on its server. All contents are provided by non-affiliated third parties.
              </p>
            </div>
          </div>
        </div>

        {/* Policy Content */}
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 md:p-8 space-y-8">
          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-premium-gradient"></div>
              Intermediary Disclaimer (India IT Act Section 79)
            </h2>
            <p className="text-zinc-400 leading-relaxed text-sm md:text-base mb-4">
              ZIVOX is an intermediary under Section 2(1)(w) of the Information Technology Act 2000. 
              We do not create, edit, host, or store any third-party content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-premium-gradient"></div>
              Copyright Infringement
            </h2>
            <p className="text-zinc-400 leading-relaxed text-sm md:text-base mb-4">
              ZIVOX is a search engine/aggregator that indexes publicly available streaming links.
              We do not host, store, or distribute any video content. All content is hosted by third parties.
              ZIVOX does not compress, modify, or distribute copyrighted material.
            </p>
            <p className="text-zinc-400 leading-relaxed text-sm md:text-base">
              If you are a copyright owner and believe your content has been infringed,
              please contact us at <a href="mailto:zivox.tv@proton.me" className="text-brand-500 hover:underline">zivox.tv@proton.me</a> for immediate removal of the indexing link.
            </p>
          </section>
        </div>

        {/* Contact Section */}
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-2">Have questions?</h2>
            <p className="text-zinc-400 text-sm">For general inquiries regarding this policy, contact us.</p>
          </div>
          <a 
            href="mailto:zivox.tv@proton.me" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors font-semibold border border-zinc-700 hover:border-zinc-600 w-full md:w-auto"
          >
            <Mail size={18} />
            zivox.tv@proton.me
          </a>
        </div>
        
        {/* Back Button */}
        <div className="pt-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors text-sm font-semibold w-fit"
          >
            <ArrowLeft size={16} />
            Return to Home
          </Link>
        </div>

      </div>
    </div>
  );
}
