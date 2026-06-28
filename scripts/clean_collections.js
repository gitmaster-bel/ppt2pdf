const fs = require('fs');
const path = require('path');

function cleanCollections(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove 480243 from the array
  content = content.replace(/, 480243/g, '');

  // Add the stree tagline if missing
  if (filePath.includes('collectionsData.ts') && !content.includes('1639816:')) {
    content = content.replace(
      '505479: "High stakes, slick cons, endless style",',
      '505479: "High stakes, slick cons, endless style",\n    1639816: "Chanderi\'s terrifying ghost will not spare you",'
    );
  }

  // Remove 480243 tagline if present
  if (filePath.includes('collectionsData.ts') && content.includes('480243:')) {
    content = content.replace(/480243: "Rajinikanth's king of Dharavi rises",\n/g, '');
  }

  fs.writeFileSync(filePath, content);
  console.log('Cleaned', filePath);
}

cleanCollections(path.join(__dirname, '../lib/collectionsData.ts'));
cleanCollections(path.join(__dirname, '../app/page.tsx'));
