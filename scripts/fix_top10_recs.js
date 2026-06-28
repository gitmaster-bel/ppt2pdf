const fs = require('fs');
const path = require('path');

function updatePage() {
  const file = path.join(__dirname, '../app/page.tsx');
  let content = fs.readFileSync(file, 'utf8');

  // Fix Top 10 to be purely global
  content = content.replace(
    /<Top10Row title="Top 10 Today" items=\{blend5050\(trendingResults, regionalTrending.results \|\| \[\], 10\) as Media\[\]\} \/>/g,
    '<Top10Row title="Top 10 Today" items={trendingResults.slice(0, 10) as Media[]} />'
  );

  // Add Top 10 and Hero items to excludeIds so they don't appear in recommendations
  content = content.replace(
    /const excludeIds = regionalTrending.results \? regionalTrending.results.map\(\(item: any\) => item.id\) : \[\];/g,
    `const excludeIds = [
    ...(regionalTrending.results ? regionalTrending.results.map((item: any) => item.id) : []),
    ...(trendingResults.slice(0, 10).map((item: any) => item.id))
  ];`
  );

  fs.writeFileSync(file, content);
  console.log('Updated app/page.tsx');
}

function updateRecommended(fileRelative) {
  const file = path.join(__dirname, '..', fileRelative);
  let content = fs.readFileSync(file, 'utf8');

  // Increase pages from 5 to 6 to get 120 items
  content = content.replace(
    /const pgs = \['1', '2', '3', '4', '5'\];/g,
    "const pgs = ['1', '2', '3', '4', '5', '6'];"
  );
  
  // Make sure to shuffle 84/36 to make 120 (70% / 30%)
  content = content.replace(
    /\.\.\.natives\.slice\(0, 70\),/g,
    '...natives.slice(0, 84),'
  );
  content = content.replace(
    /\.\.\.engs\.slice\(0, 30\)/g,
    '...engs.slice(0, 36)'
  );

  fs.writeFileSync(file, content);
  console.log('Updated', fileRelative);
}

updatePage();
updateRecommended('app/recommended/[type]/RecommendedClient.tsx');
updateRecommended('components/media/RecommendedForYou.tsx');
