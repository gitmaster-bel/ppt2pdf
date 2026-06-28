const fs = require('fs');
const path = require('path');

function fixCollections(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace James Bond 575 with 645
  content = content.replace(/\b575\b/g, '645');

  // Remove 669960, 673213, 413369
  content = content.replace(/, 669960/g, '');
  content = content.replace(/, 673213/g, '');
  content = content.replace(/, 413369/g, '');
  
  // Also remove if they are at the beginning or without comma
  content = content.replace(/\b669960\b,?/g, '');
  content = content.replace(/\b673213\b,?/g, '');
  content = content.replace(/\b413369\b,?/g, '');

  fs.writeFileSync(filePath, content);
  console.log('Fixed', filePath);
}

fixCollections(path.join(__dirname, '../lib/collectionsData.ts'));
fixCollections(path.join(__dirname, '../app/page.tsx'));
