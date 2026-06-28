const fs = require('fs');
const path = require('path');

function addFilterToClient(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // We find where combined array is filtered and add date check.
  const regex = /const uniqueResults = combined\.filter\(item => \{/;
  const replacement = `const now = new Date().toISOString().split('T')[0];
        const uniqueResults = combined.filter(item => {
           // Ensure it's not unreleased
           if (item.media_type !== 'person') {
             const date = item.release_date || item.first_air_date;
             if (!date || date > now) return false;
           }`;

  if (content.includes(replacement)) {
    console.log('Already updated', filePath);
    return;
  }
  
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content);
  console.log('Updated', filePath);
}

addFilterToClient(path.join(__dirname, '../app/recommended/[type]/RecommendedClient.tsx'));
addFilterToClient(path.join(__dirname, '../components/media/RecommendedForYou.tsx'));
