const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, '../lib/sources.ts');
let content = fs.readFileSync(filepath, 'utf8');

// 1. Remove 1Embed from the top array so we can place it later.
// We'll use string replacement to extract 1Embed.
// It starts at "id: "1embed"," and ends before "id: "vidnest","
const oneEmbedRegex = /\{\s*id: "1embed",[\s\S]*?(?=\s*\{\s*id: "vidnest")/m;
const matchOneEmbed = content.match(oneEmbedRegex);
let oneEmbedObj = matchOneEmbed[0].trim();
// Replace publicName for 1Embed so it doesn't say "Server 2"
oneEmbedObj = oneEmbedObj.replace(/publicName: "Server 2",/, 'publicName: "1Embed.cc",');
oneEmbedObj = oneEmbedObj.replace(/name: "1Embed\.cc",/, 'name: "1Embed.cc (Backup)",');

// Remove it from the current position
content = content.replace(matchOneEmbed[0], '');

// 2. Insert Nxsha as Server 2 right before VidNest
const nxshaObj = `{
    id: "nxsha",
    name: "Nxsha App",
    publicName: "Server 2",
    type: "iframe",
    tier: 1,
    feature: "Fast global CDN, multi-language dubs/subs, Ad-free",
    hasPopups: false,
    noAds: true,
    hasLanguageOptions: true,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? \`https://web.nxsha.app/embed/movie/\${id}?lang=\${lang || 'en'}&autoplay=true\`
        : \`https://web.nxsha.app/embed/tv/\${id}/\${season}/\${episode}?lang=\${lang || 'en'}&autoplay=true\`
  },
  `;
content = content.replace(/\{\s*id: "vidnest"/, nxshaObj + '{\n    id: "vidnest"');

// 3. Add SpencerDevs as Server 9 right before VidLux (which is currently Server 9)
const spencerObj = `{
    id: "spencerdevs",
    name: "SpencerDevs",
    publicName: "Server 9",
    type: "iframe",
    tier: 1,
    feature: "Fast reliable streams, clean player, Ad-free",
    hasPopups: false,
    noAds: true,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? \`https://spencerdevs.xyz/movie/\${id}\`
        : \`https://spencerdevs.xyz/tv/\${id}/\${season}/\${episode}\`
  },
  `;
content = content.replace(/\{\s*id: "vidlux"/, spencerObj + '{\n    id: "vidlux"');

// 4. Update the publicNames of the shifted servers
content = content.replace(/publicName: "Server 9",(?=\s*type: "iframe",\s*tier: 1,\s*feature: "Good, fast, Ad-free")/g, 'publicName: "Server 10",'); // vidlux
content = content.replace(/publicName: "Server 10",(?=\s*type: "iframe",\s*tier: 1,\s*feature: "Extensive backup links)/g, 'publicName: "Server 11",'); // smashystream
content = content.replace(/publicName: "Server 11",(?=\s*type: "iframe",\s*tier: 1,\s*feature: "Auto-play enabled)/g, 'publicName: "Server 12",'); // cinesrc

// 5. Insert 1Embed after CineSrc (now Server 12)
// CineSrc ends before "// ── Additional Servers"
content = content.replace(/\/\/ ── Additional Servers ───────────────────────────/, oneEmbedObj + '\n  },\n  // ── Additional Servers ───────────────────────────');

// 6. Update TOP_8_IDS and EXTENDED_TOP_IDS
// We replaced 1embed with nxsha in TOP 8
content = content.replace(/"1embed"/g, '"nxsha"'); 
// But wait, we also added spencerdevs (Server 9). 
// TOP_8_IDS is Server 1-8. EXTENDED_TOP_IDS is TOP_8 + 9,10,11. 
// Now it's TOP_8 + 9,10,11,12.
content = content.replace(/export const EXTENDED_TOP_IDS = \[\.\.\.TOP_8_IDS, "vidlux", "smashystream", "cinesrc"\];/, 'export const EXTENDED_TOP_IDS = [...TOP_8_IDS, "spencerdevs", "vidlux", "smashystream", "cinesrc"];');

// We need to make sure 1embed codename is back in SERVER_CODENAMES if it was replaced.
content = content.replace(/'nxsha':\s*'flare',/, "'nxsha': 'flare',\n  '1embed': 'aurora',");

// Add spencerdevs to CODENAMES
content = content.replace(/'mappletv':/, "'spencerdevs': 'sirius',\n  'mappletv':");

fs.writeFileSync(filepath, content);
console.log("Updated sources array.");
