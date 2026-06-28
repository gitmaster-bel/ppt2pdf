const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, '../lib/sources.ts');
let content = fs.readFileSync(filepath, 'utf8');

// 1. Shift existing public names
content = content.replace(/publicName: "Server 12",/g, 'publicName: "Server 13",'); // cinesrc
content = content.replace(/publicName: "Server 11",/g, 'publicName: "Server 12",'); // smashystream
content = content.replace(/publicName: "Server 10",/g, 'publicName: "Server 11",'); // vidlux

// 2. Insert 1embed before vidlux
const oneEmbedObj = `{
    id: "1embed",
    name: "1Embed.cc",
    publicName: "Server 10",
    type: "iframe",
    tier: 1,
    feature: "Highly resilient backup · Ad-free",
    hasPopups: false,
    noAds: true,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? \`https://1embed.cc/embed/movie/\${id}\`
        : \`https://1embed.cc/embed/tv/\${id}/\${season}/\${episode}\`
  },
  `;

content = content.replace(/\{\s*id: "vidlux"/, oneEmbedObj + '{\n    id: "vidlux"');

// 3. Update EXTENDED_TOP_IDS
content = content.replace(
  /export const EXTENDED_TOP_IDS = \[\.\.\.TOP_8_IDS, "spencerdevs", "vidlux", "smashystream", "cinesrc"\];/,
  'export const EXTENDED_TOP_IDS = [...TOP_8_IDS, "spencerdevs", "1embed", "vidlux", "smashystream", "cinesrc"];'
);

// We need to double check if 1embed was somehow left behind in the file elsewhere.
// It shouldn't be since the grep search earlier didn't find its id in the array.

fs.writeFileSync(filepath, content);
console.log("Reinserted 1embed and updated order.");
