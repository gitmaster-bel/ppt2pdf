const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../components/layout/Navbar.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace AI Search class
content = content.replace(
  /className="hidden sm:flex items-center gap-2 px-3\.5 py-1\.5 rounded-full bg-white\/5 border border-white\/10 hover:bg-brand-500\/10 hover:border-brand-500\/30 transition-all duration-300 group shadow-\[0_0_15px_rgba\(255,255,255,0\.02\)\] hover:shadow-\[0_0_25px_color-mix\(in_srgb,var\(--brand-500\)_20%,transparent\)\]"/,
  'className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 hover:border-brand-500/30 transition-all duration-300 group shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_color-mix(in_srgb,var(--brand-500)_20%,transparent)]"'
);

// Replace Regular Search class
content = content.replace(
  /className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white\/5 border border-white\/10 hover:bg-white\/10 hover:border-white\/20 text-white\/50 hover:text-white transition-all duration-200 active:scale-95"/,
  'className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 hover:border-white/20 text-white/60 hover:text-white transition-all duration-200 active:scale-95 shadow-[0_0_15px_rgba(0,0,0,0.5)]"'
);

fs.writeFileSync(file, content);
console.log('Updated search inputs bg in Navbar.tsx');
