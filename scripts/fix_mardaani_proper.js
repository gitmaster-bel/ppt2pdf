const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../lib/collectionsData.ts');
let content = fs.readFileSync(file, 'utf8');

// Remove 476740 from India
content = content.replace(/, 476740/, '');

// Move 736592 from Japan to India
content = content.replace(/, 736592,/, ',');
content = content.replace(/1639816/, '1639816, 736592');

fs.writeFileSync(file, content);
console.log('Fixed Mardaani ID in collectionsData.ts properly');
