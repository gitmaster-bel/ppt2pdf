const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, '../lib/sources.ts');
let content = fs.readFileSync(filepath, 'utf8');

// 1. Update Source interface
content = content.replace(
  'themeHex?: string',
  'themeHex?: string,\n    lang?: string'
);
content = content.replace(
  'noAds: boolean;',
  'noAds: boolean;\n  hasLanguageOptions?: boolean;'
);

// 2. Update all url implementations to accept lang
content = content.replace(/url: \((.*?)\) =>/g, (match, p1) => {
  if (p1.includes('lang')) return match; // already has lang
  // p1 is typically `type, id, season, episode, themeHex`
  return `url: (${p1}, lang) =>`;
});

fs.writeFileSync(filepath, content);
console.log("Updated Source interface and url signatures.");
