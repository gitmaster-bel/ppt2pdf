
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Mail, Database, HardDrive, EyeOff } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy',
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen pb-28 md:pb-20 pt-28 max-w-4xl mx-auto px-4 w-full">
      
      {/* Header */}
      <div className="mb-12 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-semibold mb-6 border border-emerald-500/20">
          <ShieldCheck size={16} />
          Your Privacy First
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-white mb-4">
          Privacy <span className="text-emerald-500">Policy</span>
        </h1>
        <p className="text-zinc-400 font-mono text-sm">Last updated: June 2026</p>
      </div>

      <div className="space-y-8">
        
        {/* Core Philosophy Card */}
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 md:p-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 shrink-0">
              <EyeOff size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2 font-display">
                Zero Personal Data Collection
              </h2>
              <p className="text-zinc-300 leading-relaxed text-sm md:text-base">
                ZIVOX operates with the highest standards of user privacy and security. We do not require you to create an account, and we <strong className="text-white">do not collect personal identifying information (PII)</strong> such as names, emails, or phone numbers to use the service.
              </p>
            </div>
          </div>
        </div>

        {/* Policy Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 md:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <HardDrive size={18} className="text-emerald-500" />
              Local Storage Only
            </h2>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Your watch history, favorites, and platform preferences are stored <strong>strictly locally in your browser</strong> using standard web storage technologies. This data never leaves your device and is never transmitted to our servers.
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 md:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Database size={18} className="text-emerald-500" />
              Third-Party Services
            </h2>
            <p className="text-zinc-400 leading-relaxed text-sm">
              This site does not store any files. When streaming content, your browser connects directly to third-party video hosts. These third-party services may collect IP addresses and employ their own cookies.
            </p>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 md:p-8 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            Analytics
          </h2>
          <p className="text-zinc-400 leading-relaxed text-sm md:text-base">
            We may use standard, fully anonymized analytics services to monitor platform health and traffic levels. This data is aggregated and cannot be used to identify individual users in any way.
          </p>
        </div>

        {/* Contact Section */}
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-2">Have questions?</h2>
            <p className="text-zinc-400 text-sm">If you have any questions about this Privacy Policy, please contact us.</p>
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
