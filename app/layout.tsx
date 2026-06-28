import './globals.css';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/layout/PageTransition';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { WelcomeModal } from '@/components/ui/WelcomeModal';
import { NotificationToaster } from '@/components/ui/NotificationToaster';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { Analytics } from '@vercel/analytics/react';

import { SecurityGuard } from '@/components/ui/SecurityGuard';
import { ThemePromptModal } from "@/components/ui/ThemePromptModal";
import { GlobalDonationVerifier } from '@/components/ui/GlobalDonationVerifier';


const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: {
    default: 'ZivoxTV',
    template: '%s | ZivoxTV',
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  manifest: '/manifest.json',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${space.variable} ${mono.variable}`}>
      <head>
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="robots" content="noindex, nofollow, noai, noimageai, noarchive, nosnippet" />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                const originalReleasePointerCapture = Element.prototype.releasePointerCapture;
                Element.prototype.releasePointerCapture = function(pointerId) {
                  try {
                    originalReleasePointerCapture.call(this, pointerId);
                  } catch (e) {
                    if (e.name !== 'NotFoundError') {
                      throw e;
                    }
                  }
                };
              }
            `
          }}
        />

        {/* ── Theme Injection (runs before first paint — prevents FOUC) ── */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var s = localStorage.getItem('voidstream_app_state_v2');
                  if (s) {
                    var d = JSON.parse(s);
                    var t = d && d.preferences && d.preferences.theme;
                    if (t && t !== 'violet') {
                      document.documentElement.setAttribute('data-theme', t);
                    }
                  }
                } catch(e) {}
              })();
            `
          }}
        />

        {/* ── Strict Anti-Hacker & Console Blocker ── */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined') {
                  // Block console completely
                  const noop = () => {};
                  const methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'clear', 'trace', 'group', 'groupCollapsed', 'groupEnd', 'time', 'timeEnd', 'count', 'dir', 'dirxml', 'assert', 'profile', 'profileEnd'];
                  for (let i = 0; i < methods.length; i++) {
                    window.console[methods[i]] = noop;
                  }
                  Object.freeze(window.console);
                  
                  // Block keyboard shortcuts
                  document.addEventListener('keydown', function(e) {
                    if (
                      e.key === 'F12' || 
                      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
                      (e.ctrlKey && e.key === 'U') ||
                      (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'J' || e.key === 'U'))
                    ) {
                      e.preventDefault();
                      return false;
                    }
                  }, { capture: true });

                  // Block right click / context menu
                  document.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                  }, { capture: true });

                  // Block devtools via debugger loop
                  setInterval(function() {
                    (function() { return false; })['constructor']('debugger')();
                  }, 500);
                }
              })();
            `
          }}
        />

        {/* ── Mobile Scroll Optimizer ── */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                let scrollTimer;
                window.addEventListener('scroll', function() {
                  if (!document.body.classList.contains('disable-hover')) {
                    document.body.classList.add('disable-hover');
                  }
                  clearTimeout(scrollTimer);
                  scrollTimer = setTimeout(function() {
                    document.body.classList.remove('disable-hover');
                  }, 150);
                }, { passive: true });
              }
            `
          }}
        />
      </head>
      <body className="bg-void-950 text-zinc-100 min-h-screen flex flex-col font-body" suppressHydrationWarning>
        {/* Ambient Background — Zivox Dark Violet */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden motion-reduce:hidden" style={{ background: '#07070d', contain: 'strict' }}>
          {/* Primary ambient glow — uses brand theme color */}
          <div
            style={{
              position: 'absolute',
              top: '-25%',
              left: '50%',
              transform: 'translateX(-50%) translateZ(0)',
              width: '70%',
              height: '65%',
              background: 'radial-gradient(ellipse at center, var(--brand-ambient) 0%, transparent 70%)',
              filter: 'blur(40px)',
              animation: 'purple-beam 18s ease-in-out infinite',
              willChange: 'transform, opacity',
            }}
          />
          {/* Top-left deep accent — always present for depth */}
          <div
            style={{
              position: 'absolute',
              top: '-10%',
              left: '-5%',
              width: '45%',
              height: '50%',
              background: 'radial-gradient(ellipse at center, var(--brand-ambient) 0%, transparent 70%)',
              animation: 'purple-beam 24s ease-in-out infinite reverse',
              willChange: 'transform, opacity',
            }}
          />
          {/* Top-right complementary accent */}
          <div
            style={{
              position: 'absolute',
              top: '-5%',
              right: '-5%',
              width: '35%',
              height: '45%',
              background: 'radial-gradient(ellipse at center, color-mix(in srgb, var(--brand-ambient) 60%, transparent) 0%, transparent 60%)',
              animation: 'purple-beam 20s ease-in-out infinite 2s',
              willChange: 'transform, opacity',
            }}
          />
          {/* Bottom brand warm glow */}
          <div
            style={{
              position: 'absolute',
              bottom: '-5%',
              left: '35%',
              width: '30%',
              height: '25%',
              background: 'radial-gradient(ellipse at center, var(--brand-ambient, rgba(229,9,20,0.08)) 0%, transparent 80%)',
              opacity: 0.5,
            }}
          />
        </div>
        <GlobalLoader />
        <Navbar />
        <main className="flex-1 flex flex-col pb-20 md:pb-0 relative z-10 w-full min-h-screen">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
        <Footer />
        <ScrollToTop />
        <WelcomeModal />
        <ThemePromptModal />
        <GlobalDonationVerifier />
        <NotificationToaster />
        <SecurityGuard />
        <Analytics />
      </body>
    </html>
  );
}
