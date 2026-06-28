const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../app/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// I will extract the JSX return block for DeferredRows and replace it.
const jsxRegex = /  return \(\s*<>\s*<div className="md:hidden block mt-4 z-20 relative">[\s\S]*?<\/div>\s*<\/>\s*\);/;

const newJsx = `  return (
    <>
      <div className="md:hidden block mt-4 z-20 relative">
        <TimeBasedWidget items={widgetPool} variant="mobile" />
      </div>

      <div className="flex flex-col relative z-20 pb-[calc(64px+env(safe-area-inset-bottom,0px))] md:pb-16 md:mt-4 gap-6 md:gap-10">
        <ContinueWatching />
        
        <RegionalContent />
        
        <div className="hidden md:block">
          <Top10Row title="Top 10 Today" items={trendingResults.slice(0, 10) as Media[]} />
        </div>
        
        {collectionsData.length > 0 && <CollectionsRow collections={collectionsData} />}
        
        <RecommendedForYou mediaType="all" excludeIds={excludeIds} />
        
        <HorizontalRow title="Global Trending" subtitle="What the world is watching today" items={trendingResults.slice(10) as Media[]} seeAllHref="/trending/all" />
        
        <div className="hidden md:block">
          <TimeBasedWidget items={widgetPool} variant="desktop" />
        </div>
        
        <div className="px-4 md:px-12 mt-2">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Explore Platforms</h2>
          <ProvidersGrid />
        </div>
        
        <ProviderHeroShelf 
          title="Top on Netflix"
          provider={PROVIDERS.find(p => p.id === 8)!}
          items={(netflixData.results || []) as Media[]}
        />
        
        <ProviderHeroShelf 
          title="Prime Video Exclusives"
          provider={PROVIDERS.find(p => p.id === 9)!}
          items={(primeData.results || []) as Media[]}
        />

        {(popAnime.results && popAnime.results.length > 0) && (
          <HorizontalRow title="Trending Anime" subtitle="Top animated series right now" items={popAnime.results || []} seeAllHref="/anime/trending" />
        )}
        
        <HorizontalRow title="Critically Acclaimed Movies" subtitle="Highest rated of all time" items={blendedTopMovies as Media[]} seeAllHref="/movies/top-rated" />
        <HorizontalRow title="Top Rated Series" subtitle="Must-watch television" items={blendedTopTv as Media[]} seeAllHref="/tv/top-rated" />
        <HorizontalRow title="Modern Classics" subtitle="Iconic movies (1980-2014)" items={classicMovies.results || []} />
        <HorizontalRow title="Underrated Gems" subtitle="High ratings, fewer votes" items={underratedMovies.results || []} />
      </div>
    </>
  );`;

if (jsxRegex.test(content)) {
  content = content.replace(jsxRegex, newJsx);
  fs.writeFileSync(file, content);
  console.log('Reordered homepage rows successfully');
} else {
  console.log('Could not match JSX block');
}
