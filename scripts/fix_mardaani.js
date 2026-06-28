const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../lib/collectionsData.ts');
let content = fs.readFileSync(file, 'utf8');

// Insert 736592 into the regional (India) list in collectionsData.ts
if (!content.includes('736592')) {
  // Let's add it to the Indian collections
  content = content.replace(
    /374511, 96850, 386410,/,
    '374511, 96850, 386410, 736592,'
  );
  
  // Also add the tagline
  content = content.replace(
    /17235: "Hell's own hero fights for humankind",\s*\n\s*476740: "Rani Mukerji battles child trafficking alone"/,
    '17235: "Hell\'s own hero fights for humankind",\n    736592: "Rani Mukerji battles child trafficking alone"'
  );
  
  // Just in case 476740 was already removed, we can append to the end of the object
  if (!content.includes('736592:')) {
    content = content.replace(
      /17235: "Hell's own hero fights for humankind"\s*\n\s*\};/,
      '17235: "Hell\'s own hero fights for humankind",\n    736592: "Rani Mukerji battles child trafficking alone"\n  };'
    );
  }
}

fs.writeFileSync(file, content);
console.log('Fixed Mardaani ID in collectionsData.ts');
