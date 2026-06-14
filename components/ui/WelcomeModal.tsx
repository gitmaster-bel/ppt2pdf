'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { X, Play, ShieldCheck, Heart, Share2, Star, Gem, Coffee } from 'lucide-react';
import { ShareModal } from '@/components/ui/ShareModal';
import { DonationModal } from '@/components/ui/DonationModal';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getImageUrl } from '@/lib/tmdb';
import { generateSlug } from '@/lib/utils';

const TRENDING_PICKS = [
  { "id": 220102, "title": "Spider-Noir", "type": "tv", "backdrop": "/6t2FvBr9DS8MOq0m5FAwPBCdAW5.jpg", "poster": "/oD8WSVqz84ZRfelkr7JPeJwR9Iv.jpg", "year": "2026" },
  { "id": 1083381, "title": "Backrooms", "type": "movie", "backdrop": "/mCpwRayjXMFzKHbjbzc5JRKfq1O.jpg", "poster": "/rhGx6E3qRNMgj3i5su2oukNHwIQ.jpg", "year": "2026" },
  { "id": 1339713, "title": "Obsession", "type": "movie", "backdrop": "/rZfmzpixLKLR3Hg2u0WgC7XLFl8.jpg", "poster": "/6X4qFYBsG3bpWDG2XIKqr04kFJa.jpg", "year": "2026" },
  { "id": 1273221, "title": "Scary Movie", "type": "movie", "backdrop": "/lj6AaDqDUbzm2XJltFNHeAm2uXN.jpg", "poster": "/2OHkZEqQL4OjYXIqWopJu0BijTD.jpg", "year": "2026" },
  { "id": 1242265, "title": "Fuze", "type": "movie", "backdrop": "/8wIaBCeGv3UhIn5CJOWQGHT1Cif.jpg", "poster": "/oMFdQE5hMJ9JjhNORegwTo0GKmh.jpg", "year": "2026" },
  { "id": 1430077, "title": "Hokum", "type": "movie", "backdrop": "/woZX9wZaiX70LbW7bOeNccNTIhp.jpg", "poster": "/jKPWwsbAM6HKURPYQ1eG8DmKMKn.jpg", "year": "2026" },
  { "id": 85552, "title": "Euphoria", "type": "tv", "backdrop": "/mez2Z3WqlPKNXpi7mWoiiE5guE9.jpg", "poster": "/aJrG7OkoTMPWG5c8opz8a93AZPY.jpg", "year": "2019" },
  { "id": 1122573, "title": "In the Grey", "type": "movie", "backdrop": "/bIy0555ukSqweSqG9MtRnoyisQI.jpg", "poster": "/dQgIcW6Th08kMRf2HBoYWoFE6OD.jpg", "year": "2026" },
  { "id": 454639, "title": "Masters of the Universe", "type": "movie", "backdrop": "/eQySd26OW7UmCuaeBOL7qy6foMn.jpg", "poster": "/3YMd9Ogae4rDKLWuAZFuse9xhc5.jpg", "year": "2026" },
  { "id": 76479, "title": "The Boys", "type": "tv", "backdrop": "/bq28ajZaoMyzEIm6REelqyqtEDZ.jpg", "poster": "/in1R2dDc421JxsoRWaIIAqVI2KE.jpg", "year": "2019" },
  { "id": 124364, "title": "FROM", "type": "tv", "backdrop": "/xLdw1xdHocKYFFvx7w41NchXMfJ.jpg", "poster": "/pRtJagIxpfODzzb0T0NAvZSzErC.jpg", "year": "2022" },
  { "id": 1327819, "title": "Hoppers", "type": "movie", "backdrop": "/u53UYu5XG2hNgWGvs3xGhAVzypl.jpg", "poster": "/xjtWQ2CL1mpmMNwuU5HeS4Iuwuu.jpg", "year": "2026" },
  { "id": 1275779, "title": "Disclosure Day", "type": "movie", "backdrop": "/5p6BsJtnPbglYN15MuiUEppPl0f.jpg", "poster": "/3o5YPjDGDTcTDL5ftDA9NwN9dLd.jpg", "year": "2026" },
  { "id": 273240, "title": "Off Campus", "type": "tv", "backdrop": "/52sp0vPhLOWrZ1QoZIWiapronM.jpg", "poster": "/cbODFqkcmRgrYH8NkG4Q4Hcg8Z1.jpg", "year": "2026" },
  { "id": 1084244, "title": "Toy Story 5", "type": "movie", "backdrop": "/wENlYOyR10DZzkICmrGUQQX4Ih5.jpg", "poster": "/7BuN6lQCAq1tLz2l3g6sHVSFGib.jpg", "year": "2026" },
  { "id": 687163, "title": "Project Hail Mary", "type": "movie", "backdrop": "/2I1OFQJ0L9T0dpU6FobKFWV2PxX.jpg", "poster": "/yihdXomYb5kTeSivtFndMy5iDmf.jpg", "year": "2026" },
  { "id": 1228710, "title": "The Mandalorian and Grogu", "type": "movie", "backdrop": "/6zg7A9ICOthNR2TSXlT51KvXrsA.jpg", "poster": "/5Vi8dSauVwH1HOsiZceDMbRr1Ca.jpg", "year": "2026" },
  { "id": 37854, "title": "One Piece", "type": "tv", "backdrop": "/4Mt7WHox67uJ1yErwTBFcV8KWgG.jpg", "poster": "/dB4EDhre2dsC2kxYDavyKWqLQwi.jpg", "year": "1999" },
  { "id": 1116201, "title": "Iron Lung", "type": "movie", "backdrop": "/gqGQ0zADV5FIcgMWtWX8FcGQjFp.jpg", "poster": "/sIwakdbMGS1krtgendTWpxTY9Hw.jpg", "year": "2026" },
  { "id": 252107, "title": "Star City", "type": "tv", "backdrop": "/asROh8ULhbYpB4C7x1Q3iFtcxsB.jpg", "poster": "/jjJZyBCDgyYylGdtctuqEYcO7Lc.jpg", "year": "2026" },
  { "id": 936075, "title": "Michael", "type": "movie", "backdrop": "/xBT0oNq6rsTFv4SxG5uGRIEOrq6.jpg", "poster": "/zm0KAbOjlt9eR5y7vDiL2dEOwMl.jpg", "year": "2026" },
  { "id": 931285, "title": "Mortal Kombat II", "type": "movie", "backdrop": "/4EAAwpylq313qrDqpCxulUrXBNF.jpg", "poster": "/lIsMeDbwntNXSUVHmWMMRXEZOVc.jpg", "year": "2026" },
  { "id": 65942, "title": "Re:ZERO", "type": "tv", "backdrop": "/x6y59dJBE1o0r4YRsWVQXE2nnlB.jpg", "poster": "/5MrRCj7z92YLWMXHeWKp19eJPYv.jpg", "year": "2016" },
  { "id": 270476, "title": "Widow's Bay", "type": "tv", "backdrop": "/u6XtMg9Ai9siEbEs0UudPS3EaZY.jpg", "poster": "/5lcxWLVAEICkFpuAiV1aMy7ZZj3.jpg", "year": "2026" },
  { "id": 60625, "title": "Rick and Morty", "type": "tv", "backdrop": "/9In9QgVJx7PlFOAgVHCKKSbo605.jpg", "poster": "/owhkU6KRqdXoUQpjV8uyZGPtX58.jpg", "year": "2013" },
  { "id": 1390300, "title": "Over Your Dead Body", "type": "movie", "backdrop": "/sb76azrAXr9U13uEQxNP5e3fujY.jpg", "poster": "/6yPvopLmtoyxzJt6Cr0BRyFxtrd.jpg", "year": "2026" },
  { "id": 1226863, "title": "The Super Mario Galaxy Movie", "type": "movie", "backdrop": "/9Z2uDYXqJrlmePznQQJhL6d92Rq.jpg", "poster": "/eJGWx219ZcEMVQJhAgMiqo8tYY.jpg", "year": "2026" },
  { "id": 1304313, "title": "Lee Cronin's The Mummy", "type": "movie", "backdrop": "/xugEpZk9YQ0DIz1aFvH5HGkqpZK.jpg", "poster": "/1q308iixueCU4pFtSYugNOevtNx.jpg", "year": "2026" },
  { "id": 83533, "title": "Avatar: Fire and Ash", "type": "movie", "backdrop": "/iN41Ccw4DctL8npfmYg1j5Tr1eb.jpg", "poster": "/aabwWZWx6z1aYP4PX2ADvbDKktd.jpg", "year": "2025" },
  { "id": 135934, "title": "The Legend of Vox Machina", "type": "tv", "backdrop": "/qCGwPCwlSiLdlYinzy9rSQDjQX1.jpg", "poster": "/zjQTSYZEmy0GVnK1aFLvNiAwluo.jpg", "year": "2022" },
  { "id": 1662414, "title": "Propeller One-Way Night Coach", "type": "movie", "backdrop": "/ldUVeDfA5ID2vchHGejrEltoBSN.jpg", "poster": "/joal4OSVC4T1yFb3kph91tkNNFf.jpg", "year": "2026" },
  { "id": 284725, "title": "Not Suitable for Work", "type": "tv", "backdrop": "/ysYPo1JqzHiHoIHpW9wXCtvY1LW.jpg", "poster": "/hpucDFIvWwcn6sXk8EOEX0dbY0C.jpg", "year": "2026" },
  { "id": 90521, "title": "Love Island USA", "type": "tv", "backdrop": "/m0TiLZ79RR19Zz0AZruQSBeH39x.jpg", "poster": "/kU2y21cls8WargMaX7KI47URMjD.jpg", "year": "2019" },
  { "id": 323111, "title": "Michael Jackson: The Verdict", "type": "tv", "backdrop": "/jaT8cc5VhOXO1JCbuNt8cgeu3ah.jpg", "poster": "/8R40yI5AJ931Hd3P4Yf8pdFgwJ1.jpg", "year": "2026" },
  { "id": 1380291, "title": "Tom Clancy's Jack Ryan: Ghost War", "type": "movie", "backdrop": "/dd31qJxOarrHyGZwYsCzOjobQzP.jpg", "poster": "/8ehYxUh5MWE41AeE9gkHE8DKzvB.jpg", "year": "2026" },
  { "id": 299167, "title": "Dutton Ranch", "type": "tv", "backdrop": "/wh5agdl3b7fqC7mSjsCkHx4fMAs.jpg", "poster": "/xsiecCxd8lkcAluw0wWwbW5CwSv.jpg", "year": "2026" },
  { "id": 1439930, "title": "The Punisher: One Last Kill", "type": "movie", "backdrop": "/qO55CD8tgVL1T4WKn6zYFFiD6lL.jpg", "poster": "/qQclTgLMDvGBuUBFGHRipxkEwWR.jpg", "year": "2026" },
  { "id": 218342, "title": "A Good Girl's Guide to Murder", "type": "tv", "backdrop": "/qhWSPI34VHk3CkKitUL7OsxLzDK.jpg", "poster": "/1JjckYI0TkaUEXVZHyr52P2yejp.jpg", "year": "2024" },
  { "id": 284110, "title": "The Lead", "type": "tv", "backdrop": "/i5pSbVLpRKUPfFckfsX0kpHLdWC.jpg", "poster": "/vnoSyfH40sisQ6jBSap7NB3LD4H.jpg", "year": "2026" },
  { "id": 969681, "title": "Spider-Man: Brand New Day", "type": "movie", "backdrop": "/vjMvFSmGUxEtqVdaZgvFee9XkZl.jpg", "poster": "/yyB2VJEW3an2xCdcYCPQhn9QERR.jpg", "year": "2026" },
  { "id": 1325734, "title": "The Drama", "type": "movie", "backdrop": "/b8H1a89qmNxF8rqFGrG93Q9qn52.jpg", "poster": "/89Dw1ujPlIPRLddhzNuJM4F401D.jpg", "year": "2026" },
  { "id": 1380316, "title": "Is God Is", "type": "movie", "backdrop": "/sZ61Fo6Di1DvXXhrSjyF6Xunr9C.jpg", "poster": "/rCYQGHdoz7qwYsb6wXETJfUfDLX.jpg", "year": "2026" },
  { "id": 289147, "title": "The Ferry Man 10th Anniversary", "type": "tv", "backdrop": "/a84FbktGASmCKmbvEVBD3U0x3LH.jpg", "poster": "/9ilVMG2ueA0xrviD0A9WoluAcnF.jpg", "year": "2026" },
  { "id": 87917, "title": "For All Mankind", "type": "tv", "backdrop": "/9OQ5BIITkJwRJo9JA6AlCfJIGBQ.jpg", "poster": "/JP3DItWMbrrLiKR5AYUfpsNf2b.jpg", "year": "2019" },
  { "id": 1368881, "title": "Ladies First", "type": "movie", "backdrop": "/bOy625BjpCskOWnx3tD09MsKVCb.jpg", "poster": "/kjR56Yv17pbjTVBTMjqepvcus4f.jpg", "year": "2026" },
  { "id": 289271, "title": "Ashes to Crown", "type": "tv", "backdrop": "/6CgpC5cS8jvkXgkI0pRoj31nHf6.jpg", "poster": "/6pC0XDwZtKAMrx68vKUkXcOs3gM.jpg", "year": "2026" },
  { "id": 206484, "title": "Jade Dynasty", "type": "tv", "backdrop": "/5fq2lbecTwvpitm7WHfQGa0VGXh.jpg", "poster": "/oOy0PskfCQyWwsQVdHyM2PoN9H4.jpg", "year": "2022" },
  { "id": 1368337, "title": "The Odyssey", "type": "movie", "backdrop": "/m3Pom6pbD51bBv3syz8NMHda3fz.jpg", "poster": "/krVa7rKCQb4OBfsr2LTJv4rTz5q.jpg", "year": "2026" },
  { "id": 1242332, "title": "Normal", "type": "movie", "backdrop": "/1YU6Hy3x7fUh7dfOzSfjifTp20g.jpg", "poster": "/rsNdDcCKjCZm9RBMAxL3vMUokKU.jpg", "year": "2026" }
];

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [randomPick, setRandomPick] = useState(TRENDING_PICKS[0]);

  useEffect(() => {
    setMounted(true);
    setRandomPick(TRENDING_PICKS[Math.floor(Math.random() * TRENDING_PICKS.length)]);
    
    // Check if user has seen the modal before
    const hasSeen = localStorage.getItem('zivox_welcome_v4');
    if (!hasSeen) {
      localStorage.setItem('zivox_welcome_v4', 'true');
      const timer = setTimeout(() => setIsOpen(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    localStorage.setItem('zivox_welcome_v4', 'true');
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  if (!mounted) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div key="overlay" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-12" style={{ perspective: '1200px' }}>
            {/* Backdrop with extreme blur and vignette */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/70 backdrop-blur-xl"
              style={{ backgroundImage: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)' }}
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(8px)' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-4xl bg-void-950 border border-white/10 rounded-3xl md:rounded-[32px] overflow-hidden shadow-[0_30px_100px_-20px_color-mix(in srgb, var(--brand-500) 30%, transparent)] flex flex-col md:flex-row z-10 max-h-[95vh] overflow-y-auto custom-scrollbar"
            >
              {/* Left Column: Visuals & Movie Pitch */}
              <div className="md:w-[45%] shrink-0 relative h-[180px] sm:h-[220px] md:h-auto overflow-hidden group">
                <div className="absolute inset-0 z-0">
                  <Image 
                    src={getImageUrl(randomPick.backdrop, 'w780')} 
                    alt={randomPick.title} 
                    fill 
                    className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 ease-out" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-void-950 via-void-950/60 to-transparent md:bg-gradient-to-r md:from-transparent md:to-void-950" />
                </div>

                <div className="absolute inset-0 z-10 p-5 sm:p-8 flex flex-col justify-end md:justify-center text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-400 text-xs font-bold uppercase tracking-wider mb-2 md:mb-4 w-fit backdrop-blur-md">
                    <Star size={12} className="fill-brand-400" /> Start Here
                  </div>
                  
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-white mb-1.5 md:mb-2 leading-tight drop-shadow-xl">
                    {randomPick.title}
                  </h3>
                  <p className="text-white/80 text-sm mb-6 font-medium drop-shadow-lg max-w-[90%] hidden sm:block">
                    Not sure where to begin? Dive straight into this critically acclaimed masterpiece right now.
                  </p>

                  <Link
                    href={`/watch/${randomPick.type}/${generateSlug(randomPick.id, randomPick.title)}`}
                    onClick={closeModal}
                    className="group/btn flex items-center justify-center gap-2 sm:gap-3 bg-white text-black px-4 py-2 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm transition-all hover:scale-[1.03] active:scale-[0.97] shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] w-fit"
                  >
                    <Play size={16} className="fill-black sm:w-[18px] sm:h-[18px]" />
                    <span>Watch Free</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: The Pitch & Trust */}
              <div className="md:w-[55%] p-5 sm:p-8 md:p-12 relative flex flex-col justify-center">
                {/* Close Button */}
                <button
                  onClick={closeModal}
                  className="absolute top-6 right-6 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors z-20"
                >
                  <X size={20} />
                </button>

                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2 md:mb-3">
                    <Gem className="text-brand-500 w-6 h-6 md:w-7 md:h-7" />
                    <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white leading-none">
                      Premium Streaming. <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-purple-400">Zero Compromise.</span>
                    </h2>
                  </div>
                  <p className="text-zinc-400 text-xs md:text-sm leading-relaxed mt-2 md:mt-4 font-medium hidden sm:block">
                    Welcome to ZIVOX. A sanctuary built for true entertainment lovers. We believe cinematic art shouldn't be ruined by invasive tracking, malicious redirects, or endless ads.
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:gap-4 mb-6 md:mb-8">
                  <div className="flex items-start gap-3 md:gap-4 p-4 md:p-5 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                      <ShieldCheck size={20} className="md:w-[22px] md:h-[22px]" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm md:text-[15px]">100% Genuine & Ad-Free</h4>
                      <p className="text-zinc-400 text-xs mt-1 md:mt-1.5 leading-relaxed hidden sm:block">No subscriptions. No credit cards. No hidden catch. Our promise is simple: pure, uninterrupted high-definition streaming for everyone.</p>
                    </div>
                  </div>

                  {/* Donation Box */}
                  <div 
                    onClick={() => setShowDonationModal(true)}
                    className="flex items-start gap-3 md:gap-4 p-4 md:p-5 rounded-xl md:rounded-2xl bg-brand-500/5 hover:bg-brand-500/10 border border-brand-500/20 backdrop-blur-sm relative overflow-hidden group/donate cursor-pointer transition-colors"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/10 to-brand-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-brand-500/10 text-brand-400 shrink-0">
                      <Heart size={20} className="md:w-[22px] md:h-[22px] fill-brand-400/20" />
                    </div>
                    <div className="pr-2 md:pr-4 relative z-10">
                      <h4 className="text-white font-bold text-sm md:text-[15px] flex items-center gap-2">
                        Back Our Mission <span className="text-[9px] md:text-[10px] bg-brand-500/20 text-brand-400 px-1.5 md:px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Optional</span>
                      </h4>
                      <p className="text-zinc-400 text-xs mt-1 md:mt-1.5 leading-relaxed hidden sm:block">We provide a premium, ad-free experience at zero cost to you. To maintain our high-speed servers and keep ZIVOX free of invasive ads, we rely on community support. If you value what we do, please consider backing us.</p>
                      <div className="inline-flex items-center gap-1.5 md:gap-2 mt-1 sm:mt-2 md:mt-4 text-xs font-bold text-white/60 group-hover/donate:text-white group-hover/donate:drop-shadow-[0_0_10px_var(--brand-500)] transition-all">
                        <Coffee size={14} className="text-brand-500" /> Become a Supporter <span aria-hidden="true" className="group-hover/donate:translate-x-1 transition-transform duration-300">→</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3 mt-auto">
                  <Link
                    href="/guide"
                    onClick={closeModal}
                    className="w-full sm:flex-1 py-3 md:py-4 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-xs md:text-sm transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                  >
                    Learn To Use
                  </Link>
                  <button
                    onClick={handleShare}
                    className="w-full sm:flex-1 py-3 md:py-4 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 hover:text-purple-200 font-bold text-xs md:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Share2 size={16} className="text-purple-400" /> Share Site
                  </button>
                  <button
                    onClick={closeModal}
                    className="w-full sm:flex-1 py-3 md:py-4 rounded-xl bg-premium-gradient-dark hover:bg-premium-gradient border border-brand-500/50 text-white font-bold text-xs md:text-sm transition-colors shadow-[0_0_20px_color-mix(in srgb, var(--brand-500) 20%, transparent)] cursor-pointer"
                  >
                    Enter Platform
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="ZIVOX - Premium Ad-Free Streaming"
        shareUrl={typeof window !== 'undefined' ? window.location.origin : undefined}
      />

      <DonationModal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
      />
    </>
  );
}
