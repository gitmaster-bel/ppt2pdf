const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../lib/collectionsData.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\s*:\s*"Tamil cinema's most ferocious revenge mission",/g, '');
content = content.replace(/\s*:\s*"Two legends, one unstoppable rebellion",/g, '');
content = content.replace(/\s*:\s*"Vijay's triple role defies all odds",/g, '');

fs.writeFileSync(file, content);
console.log('Fixed syntax error in collectionsData.ts');
