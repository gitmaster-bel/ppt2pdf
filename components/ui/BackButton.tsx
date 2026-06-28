'use client';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  href?: string;
}

export function BackButton({ href }: BackButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleBack = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const sessionStack = sessionStorage.getItem('app_history_stack');
      const stack: string[] = sessionStack ? JSON.parse(sessionStack) : [];
      
      if (stack.length > 1) {
        sessionStorage.setItem('is_back_nav', 'true');
        // Prefer window.history.back for immediate native response, 
        // fallback to router.back()
        if (window.history.length > 1) {
          window.history.back();
        } else {
          router.back();
        }
        return;
      }
    } catch (e) {
      console.error('Failed to navigate back:', e);
    }

    // Smart fallbacks based on pathname if history stack is empty
    if (pathname.startsWith('/collection/')) {
      const referrer = sessionStorage.getItem('zivox_collection_referrer');
      router.replace(referrer || '/collections');
    } else if (pathname.startsWith('/person/')) {
      router.replace('/');
    } else if (href) {
      router.replace(href);
    } else {
      router.replace('/');
    }
  };

  const content = (
    <>
      <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform duration-200" />
      Back
    </>
  );

  const className = "flex items-center gap-2 text-zinc-400 hover:text-white transition-all duration-200 group font-bold tracking-wider uppercase text-xs w-fit mb-6 hover:-translate-x-0.5 cursor-pointer";

  return (
    <button onClick={handleBack} className={className}>
      {content}
    </button>
  );
}
