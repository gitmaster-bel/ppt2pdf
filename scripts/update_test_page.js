const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, '../app/test-sources/page.tsx');
let content = fs.readFileSync(filepath, 'utf8');

// 1. Remove Nxsha App
const nxshaRegex = /\{\s*name:\s*"Nxsha App"[\s\S]*?\},/g;
content = content.replace(nxshaRegex, '');

// 2. Remove SpencerDevs
const spencerRegex = /\{\s*name:\s*"SpencerDevs"[\s\S]*?\},/g;
content = content.replace(spencerRegex, '');

// 3. Add language state
if (!content.includes('const [testLang, setTestLang]')) {
  content = content.replace(
    "const [episode, setEpisode] = useState(initialEpisode);",
    "const [episode, setEpisode] = useState(initialEpisode);\n  const [testLang, setTestLang] = useState('en');"
  );
}

// 4. Update the URL replacement logic for the custom tester
content = content.replace(
  "return currentSource ? currentSource.url(type, id, season, episode) : '';",
  "return currentSource ? currentSource.url(type, id, season, episode, undefined, testLang) : '';"
);

// 5. Add language selector UI right below IMDB ID
const langUI = `
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Language</label>
                  <select
                    value={testLang}
                    onChange={e => setTestLang(e.target.value)}
                    className="w-full bg-black/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                  >
                    <option value="en">English (en)</option>
                    <option value="hindi">Hindi (hindi)</option>
                    <option value="telugu">Telugu (telugu)</option>
                    <option value="tamil">Tamil (tamil)</option>
                    <option value="malayalam">Malayalam (malayalam)</option>
                    <option value="kannada">Kannada (kannada)</option>
                    <option value="ja">Japanese (ja)</option>
                    <option value="ko">Korean (ko)</option>
                    <option value="zh">Mandarin (zh)</option>
                    <option value="es">Spanish (es)</option>
                    <option value="fr">French (fr)</option>
                    <option value="de">German (de)</option>
                    <option value="ru">Russian (ru)</option>
                    <option value="ar">Arabic (ar)</option>
                  </select>
                </div>
`;
// We have <div className="grid grid-cols-2 gap-4"> containing TMDB ID and IMDB ID. We can change it to grid-cols-3 or add it below. Let's make it grid-cols-1 md:grid-cols-3
content = content.replace(
  '<div className="grid grid-cols-2 gap-4">',
  '<div className="grid grid-cols-1 md:grid-cols-3 gap-4">'
);
content = content.replace(
  'placeholder="12879782"\n                    />\n                  </div>\n                </div>\n              </div>',
  'placeholder="12879782"\n                    />\n                  </div>\n                </div>\n' + langUI + '              </div>'
);

fs.writeFileSync(filepath, content);
console.log("Updated app/test-sources/page.tsx");
