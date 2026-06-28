const fs = require('fs');
const path = require('path');
const filepath = path.join(__dirname, '../app/page.tsx');
let content = fs.readFileSync(filepath, 'utf8');

// 1. Add import
if (!content.includes('RegionalContent')) {
  content = content.replace(
    /const ProviderHeroShelf = nextDynamic\(\(\) => import\('@\/components\/providers\/ProviderHeroShelf'\)\.then\(mod => mod\.ProviderHeroShelf\)\);/,
    "const ProviderHeroShelf = nextDynamic(() => import('@/components/providers/ProviderHeroShelf').then(mod => mod.ProviderHeroShelf));\nconst RegionalContent = nextDynamic(() => import('@/components/media/RegionalContent').then(mod => mod.RegionalContent));"
  );
}

// 2. Add component
if (!content.includes('<RegionalContent />')) {
  content = content.replace(
    /<RecommendedForYou mediaType="all" \/>/,
    "<RecommendedForYou mediaType=\"all\" />\n        <RegionalContent />"
  );
}

fs.writeFileSync(filepath, content);
console.log('Injected RegionalContent');
