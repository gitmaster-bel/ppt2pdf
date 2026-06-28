const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

const newMapStr = "const regionalCollectionMap: Record<string, number[]> = {\\n" +
"    IN: [350309, 44976, 246091, 483464, 142015, 485645, 256433, 44722, 921781, 977824, 506940, 259256, 1029834, 142022, 657153, 1213248],\\n" +
"    JP: [210303, 425164, 23616, 39199, 148065, 117354, 247028, 263101, 143302, 374509, 374511, 96850, 386410],\\n" +
"    KR: [619537, 619802, 531566, 619533, 660359, 1517098, 736824, 707622, 535790, 620873, 1185967, 421904],\\n" +
"    BR: [119581, 455278, 342577, 743415, 369380, 429234, 620873, 386410, 263101, 148065, 39199],\\n" +
"    ES: [74508, 388180, 2248, 624920, 492969, 669836, 9649, 778680, 86027, 421904, 117354]\\n" +
"  };";

pageContent = pageContent.replace(/const regionalCollectionMap: Record<string, number\[\]> = \{[\s\S]*?\};\n/, newMapStr + '\\n');
fs.writeFileSync(pagePath, pageContent);
console.log('Updated app/page.tsx');
