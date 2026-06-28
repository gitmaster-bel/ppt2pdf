const fs = require('fs');
const path = require('path');

function fixRecommendationLogic(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace fetchByType implementation
  const regex = /const fetchByType = async \([\s\S]*?return typeResults.map\(item => \(\{ \.\.\.item, media_type: type \}\)\);\n[ ]*\};/;
  
  const newLogic = `const fetchByType = async (type: 'movie' | 'tv') => {
        let typeResults: any[] = [];
        
        // Fetch up to 5 pages to get a pool of ~100 items
        const pgs = ['1', '2', '3', '4', '5'];
        
        const shuffle = (arr: any[]) => {
          const newArr = [...arr];
          for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
          }
          return newArr;
        };

        if (nativeLangs.length > 0 && hasEnglish) {
          const nativeDataPromises = pgs.map(page => discoverMedia(type, { ...baseParams, with_original_language: nativeLangs.join('|'), page }));
          const enDataPromises = pgs.map(page => discoverMedia(type, { ...baseParams, with_original_language: 'en', page }));
          
          const nativeDatas = await Promise.all(nativeDataPromises);
          const enDatas = await Promise.all(enDataPromises);
          
          let natives = shuffle(nativeDatas.flatMap(d => d.results || []));
          let engs = shuffle(enDatas.flatMap(d => d.results || []));

          // 70% regional, 30% global
          const finalArr = [
            ...natives.slice(0, 70),
            ...engs.slice(0, 30)
          ];
          
          typeResults = shuffle(finalArr);
        } else if (langs.length > 0) {
          const promises = pgs.map(page => discoverMedia(type, { ...baseParams, with_original_language: langs.join('|'), page }));
          const datas = await Promise.all(promises);
          let all = datas.flatMap(d => d.results || []);
          typeResults = shuffle(all).slice(0, 100);
        } else {
          const promises = pgs.map(page => discoverMedia(type, { ...baseParams, page }));
          const datas = await Promise.all(promises);
          let all = datas.flatMap(d => d.results || []);
          typeResults = shuffle(all).slice(0, 100);
        }
        return typeResults.map(item => ({ ...item, media_type: type }));
      };`;

  content = content.replace(regex, newLogic);
  fs.writeFileSync(filePath, content);
  console.log('Updated', filePath);
}

fixRecommendationLogic(path.join(__dirname, '../app/recommended/[type]/RecommendedClient.tsx'));
fixRecommendationLogic(path.join(__dirname, '../components/media/RecommendedForYou.tsx'));
