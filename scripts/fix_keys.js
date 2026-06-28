const fs = require('fs');

const path = 'lib/collectionsData.ts';
let content = fs.readFileSync(path, 'utf8');

// Match everything inside CURATED_TAGLINES: Record<number, string> = { ... };
const match = content.match(/const CURATED_TAGLINES: Record<number, string> = \{([\s\S]*?)\n  \};/);
if (match) {
  const lines = match[1].split('\n').filter(Boolean);
  
  const uniqueKeys = new Set();
  const dedupedLines = [];
  
  for (const line of lines) {
    if (line.trim() === '') continue;
    // Extract keys. Note there can be multiple on one line originally, but my injection put 1 per line.
    // Let's just do it robustly by manually reconstructing the object from the file's current state.
  }
}
