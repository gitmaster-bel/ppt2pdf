const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../components/ui/SettingsModal.tsx');
let content = fs.readFileSync(file, 'utf8');

// Remove Bengali, Marathi, Gujarati, Punjabi
content = content.replace(/\s*\{\s*id:\s*'bn',\s*name:\s*'Bengali'\s*\},\n/g, '');
content = content.replace(/\s*\{\s*id:\s*'mr',\s*name:\s*'Marathi'\s*\},\n/g, '');
content = content.replace(/\s*\{\s*id:\s*'gu',\s*name:\s*'Gujarati'\s*\},\n/g, '');
content = content.replace(/\s*\{\s*id:\s*'pa',\s*name:\s*'Punjabi'\s*\},\n/g, '');

fs.writeFileSync(file, content);
console.log('Removed bn, mr, gu, pa from SettingsModal.tsx');
