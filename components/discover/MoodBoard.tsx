'use client';
import { motion } from 'motion/react';
import Image from 'next/image';

const MOODS = [
  { label: 'Need a Laugh', genreId: 35, image: '/lgotja3xMoJZbynwHfcQcJAEMWH.jpg', color: '#f59e0b' },
  { label: 'Terrify Me', genreId: 27, image: '/vh7np635kDIcfO6x2Y9ElgLJsuI.jpg', color: '#7c3aed' },
  { label: 'Make Me Cry', genreId: 18, image: '/zfbjgQE1uSd9wiPTX4VzsLi0rGG.jpg', color: '#ec4899' },
  { label: 'Mind-Bending', genreId: 878, image: '/2I1OFQJ0L9T0dpU6FobKFWV2PxX.jpg', color: '#06b6d4' },
  { label: 'Romantic', genreId: 10749, image: '/xnHVX37XZEp33hhCbYlQFq7ux1J.jpg', color: '#e50914' },
  { label: 'Adrenaline', genreId: 28, image: '/6zg7A9ICOthNR2TSXlT51KvXrsA.jpg', color: '#ef4444' },
  { label: 'Epic Fantasy', genreId: 14, image: '/iN41Ccw4DctL8npfmYg1j5Tr1eb.jpg', color: '#3b82f6' },
  { label: 'Anime Worlds', genreId: 16, image: '/5gzzkR7y3hnY8AD1wXjCnVlHba5.jpg', color: '#8b5cf6' },
];

export function MoodBoard({ onSelectMood }: { onSelectMood: (genreId: number) => void }) {
  return (
    <div className="mb-10 relative z-20">
      <h3 className="text-white/80 font-bold mb-4 text-xs tracking-widest uppercase">Pick a Mood</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {MOODS.map((mood) => (
          <motion.button
            key={mood.label}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectMood(mood.genreId)}
            className="group relative flex flex-col items-center justify-center rounded-2xl overflow-hidden border border-white/[0.03] hover:border-white/30 transition-all duration-500 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)]"
            style={{
              minHeight: '100px',
            }}
          >
            {/* Backdrop Image */}
            <Image
              src={`https://media.themoviedb.org/t/p/w500${mood.image}`}
              alt={mood.label}
              fill
              className="object-cover opacity-40 group-hover:opacity-70 transition-all duration-700 group-hover:scale-[1.1]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12vw"
            />
            
            {/* Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/50 to-transparent group-hover:from-[#0a0a0f]/80 transition-all duration-500" />
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-overlay"
              style={{
                background: `radial-gradient(circle at center, ${mood.color}40 0%, transparent 80%)`,
              }}
            />

            {/* Label */}
            <span className="relative z-10 text-white font-bold text-xs tracking-wider uppercase drop-shadow-md text-center px-2 group-hover:text-white transition-colors duration-300">
              {mood.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
