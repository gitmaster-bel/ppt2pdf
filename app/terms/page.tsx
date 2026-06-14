
import Link from 'next/link';
import { Scale, ArrowLeft, Mail, FileText, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service',
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen pb-28 md:pb-20 pt-28 max-w-4xl mx-auto px-4 w-full">
      
      {/* Header */}
      <div className="mb-12 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-sm font-semibold mb-6 border border-blue-500/20">
          <Scale size={16} />
          Terms of Service
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-white mb-4">
          Terms of <span className="text-blue-500">Service</span>
        </h1>
        <p className="text-zinc-400 font-mono text-sm">Last updated: June 2026</p>
      </div>

      <div className="space-y-6">
        
        {/* Intro */}
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 md:p-8">
          <p className="text-zinc-300 leading-relaxed">
            By accessing and using ZIVOX (the "Platform"), you accept and agree to be bound by the terms and provision of this agreement. Please read them carefully before using the service.
          </p>
        </div>

        {/* Content & Hosting Disclaimer */}
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 md:p-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2 font-display">
                Content and Hosting Disclaimer
              </h2>
              <p className="text-zinc-300 leading-relaxed text-sm md:text-base mb-4 font-semibold">
                This platform serves strictly as a content aggregator and does not host any media files directly. 
              </p>
              <p className="text-zinc-400 leading-relaxed text-sm">
                All content is streamed through trusted third-party services. This site does not store any files on its server. All contents are provided by non-affiliated third parties. Legal concerns regarding the files should be addressed directly with the respective file hosts and providers. ZIVOX bears no responsibility for the media files displayed by the providers.
              </p>
            </div>
          </div>
        </div>

        {/* Other Sections */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 md:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-blue-500" />
              Acceptable Use
            </h2>
            <p className="text-zinc-400 leading-relaxed text-sm">
              You agree to use the Platform only for lawful purposes. You agree not to take any action that might compromise the security of the Platform, render the Platform inaccessible to others, or otherwise cause damage to the Platform or the Content.
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 md:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              Modifications & Liability
            </h2>
            <p className="text-zinc-400 leading-relaxed text-sm mb-4">
              ZIVOX reserves the right at any time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.
            </p>
            <p className="text-zinc-400 leading-relaxed text-sm">
              In no event shall ZIVOX be liable for any direct, indirect, incidental, special, consequential or exemplary damages, including but not limited to, damages for loss of profits, goodwill, use, data or other intangible losses resulting from the use of or inability to use the service.
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 mt-4">
          <div>
            <h2 className="text-lg font-bold text-white mb-2">Have questions?</h2>
            <p className="text-zinc-400 text-sm">If you need clarification on these terms, contact us.</p>
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
