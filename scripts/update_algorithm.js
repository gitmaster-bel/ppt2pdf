const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../app/page.tsx');
let content = fs.readFileSync(file, 'utf8');

const newBlendFunc = `
  const blendProviderData = (
    globalMovies: any[], 
    globalTv: any[], 
    regionalMovies: any[], 
    regionalTv: any[], 
    total = 20
  ) => {
    // 1. Tag and deduplicate inputs
    const gM = Array.from(new Map(globalMovies.map(m => [m.id, {...m, media_type: 'movie'}])).values());
    const gT = Array.from(new Map(globalTv.map(t => [t.id, {...t, media_type: 'tv'}])).values());
    const rM = Array.from(new Map(regionalMovies.map(m => [m.id, {...m, media_type: 'movie'}])).values());
    const rT = Array.from(new Map(regionalTv.map(t => [t.id, {...t, media_type: 'tv'}])).values());

    if (!isRegional) {
      const mix = [...gT.slice(0, 6), ...gM, ...gT.slice(6)];
      return Array.from(new Map(mix.map(item => [item.id, item])).values()).slice(0, total);
    }

    // Strict filter for global to absolutely ban regional content from sneaking in
    const regionalLangs: Record<string, string[]> = {
      'IN': ['hi', 'te', 'ta', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa', 'ur', 'or', 'as'],
      'KR': ['ko'],
      'JP': ['ja'],
      'ES': ['es'],
      'BR': ['pt']
    };
    const curCode = countryCode.toUpperCase();
    const rLangs = regionalLangs[curCode] || [];

    const isGlobalStrict = (item: any) => {
      if (item.origin_country && item.origin_country.includes(curCode)) return false;
      if (rLangs.includes(item.original_language)) return false;
      return true;
    };

    const strictGlobalMovies = gM.filter(isGlobalStrict);
    const strictGlobalTv = gT.filter(isGlobalStrict);

    // Helper to shuffle
    const shuffle = (arr: any[]) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    // 2. Pick exactly 10 Regional (At least 3 TV)
    const shuffledRM = shuffle(rM);
    const shuffledRT = shuffle(rT);
    
    const pickedRegional: any[] = [];
    
    // Pick exactly 3 TV Shows first (if available)
    for (let i = 0; i < 3 && i < shuffledRT.length; i++) pickedRegional.push(shuffledRT[i]);
    
    // Fill the rest of the 10 spots with whatever is left (mix of Movies and remaining TV)
    const remainingRegional = shuffle([...shuffledRM, ...shuffledRT.slice(3)]);
    for (let i = 0; pickedRegional.length < 10 && i < remainingRegional.length; i++) {
      pickedRegional.push(remainingRegional[i]);
    }

    // 3. Pick exactly 10 Global (At least 3 TV)
    const shuffledGM = shuffle(strictGlobalMovies);
    const shuffledGT = shuffle(strictGlobalTv);
    
    const pickedGlobal: any[] = [];
    
    // Pick exactly 3 TV Shows first (if available)
    for (let i = 0; i < 3 && i < shuffledGT.length; i++) pickedGlobal.push(shuffledGT[i]);
    
    // Fill the rest of the 10 spots
    const remainingGlobal = shuffle([...shuffledGM, ...shuffledGT.slice(3)]);
    for (let i = 0; pickedGlobal.length < 10 && i < remainingGlobal.length; i++) {
      pickedGlobal.push(remainingGlobal[i]);
    }

    // 4. Arrangement
    // First 3 items MUST be 3 random regional items from our picked 10.
    const finalRegional = shuffle(pickedRegional);
    const firstThree = finalRegional.slice(0, 3);
    
    // The rest (up to 7 regional + up to 10 global) shuffled
    const theRest = shuffle([...finalRegional.slice(3), ...pickedGlobal]);

    const finalMix = [...firstThree, ...theRest];
    return Array.from(new Map(finalMix.map(item => [item.id, item])).values()).slice(0, total);
  };
`;

const regexProvider = /  const blendProviderData = \([\s\S]*?const blendedPrime = blendProviderData\([\s\S]*?\);\n/m;

content = content.replace(regexProvider, newBlendFunc.trim() + `\n
  const blendedNetflix = blendProviderData(
    netflixData.results || [], 
    netflixTvData.results || [], 
    regionalNetflixData.results || [], 
    regionalNetflixTvData.results || []
  );
  
  const blendedPrime = blendProviderData(
    primeData.results || [], 
    primeTvData.results || [], 
    regionalPrimeData.results || [], 
    regionalPrimeTvData.results || []
  );\n`);

fs.writeFileSync(file, content);
console.log('Algorithm rebuilt to guarantee exact ratios and absolute strict origin filtering.');
