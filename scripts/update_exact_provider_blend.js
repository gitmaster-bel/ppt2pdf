const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../app/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Fix Prime Provider ID from '9' to '119|9' globally in the discover calls
content = content.replace(/'9'/g, "'119|9'");

const newBlendFunc = `
  const blendProviderData = (
    globalMovies: any[], 
    globalTv: any[], 
    regionalMovies: any[], 
    regionalTv: any[], 
    total = 20
  ) => {
    const gM = globalMovies.map(m => ({...m, media_type: 'movie'}));
    const gT = globalTv.map(t => ({...t, media_type: 'tv'}));
    const rM = regionalMovies.map(m => ({...m, media_type: 'movie'}));
    const rT = regionalTv.map(t => ({...t, media_type: 'tv'}));

    if (!isRegional) {
      const mix = [...gT.slice(0, 6), ...gM, ...gT.slice(6)];
      return Array.from(new Map(mix.map(item => [item.id, item])).values()).slice(0, total);
    }

    // Filter global to strictly EXCLUDE regional origin
    const strictGlobalMovies = gM.filter(m => !(m.origin_country && m.origin_country.includes(countryCode)));
    const strictGlobalTv = gT.filter(t => !(t.origin_country && t.origin_country.includes(countryCode)));

    // Helper to shuffle
    const shuffle = (arr: any[]) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    // 1. Pick exactly 10 Regional (At least 3 TV)
    const shuffledRM = shuffle(rM);
    const shuffledRT = shuffle(rT);
    
    const pickedRegional: any[] = [];
    
    // Pick 3 TV Shows first
    for (let i = 0; i < 3 && i < shuffledRT.length; i++) pickedRegional.push(shuffledRT[i]);
    
    // Fill the rest of the 10 spots with whatever is left (mix of Movies and remaining TV)
    const remainingRegional = shuffle([...shuffledRM, ...shuffledRT.slice(3)]);
    for (let i = 0; pickedRegional.length < 10 && i < remainingRegional.length; i++) {
      pickedRegional.push(remainingRegional[i]);
    }

    // 2. Pick exactly 10 Global (At least 3 TV)
    const shuffledGM = shuffle(strictGlobalMovies);
    const shuffledGT = shuffle(strictGlobalTv);
    
    const pickedGlobal: any[] = [];
    
    // Pick 3 TV Shows first
    for (let i = 0; i < 3 && i < shuffledGT.length; i++) pickedGlobal.push(shuffledGT[i]);
    
    // Fill the rest of the 10 spots
    const remainingGlobal = shuffle([...shuffledGM, ...shuffledGT.slice(3)]);
    for (let i = 0; pickedGlobal.length < 10 && i < remainingGlobal.length; i++) {
      pickedGlobal.push(remainingGlobal[i]);
    }

    // 3. Arrangement: 
    // - First 3 items MUST be 3 random regional items from our picked 10.
    // - The rest (7 regional + 10 global = 17 items) will be randomly shuffled after them.
    
    const finalRegional = shuffle(pickedRegional);
    const firstThree = finalRegional.slice(0, 3);
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
console.log('Fixed Prime ID and updated Provider blending to exact 50% split with 3+ TV rules.');
