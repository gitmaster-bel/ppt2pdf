import React from 'react';
import { tmdb } from '@/lib/tmdb';
import { getCuratedCollectionsPool } from '@/lib/collectionsData';
import nextDynamic from 'next/dynamic';

const CollectionsRow = nextDynamic(() => import('@/components/media/CollectionsRow').then(mod => mod.CollectionsRow));

export async function CollectionsFeed({ countryCode }: { countryCode: string }) {
  const { uniqueIds: allIds, CURATED_TAGLINES: taglines } = getCuratedCollectionsPool();

  const regionalCollectionMap: Record<string, number[]> = {
    IN: [350309, 44976, 246091, 483464, 142015, 485645, 256433, 44722, 921781, 977824, 506940, 259256, 1029834, 142022, 657153, 1213248, 489399, 557748, 282971, 605068, 20970, 343944, 244500, 1397777, 341455, 505479, 1639816, 476740],
    JP: [210303, 425164, 23616, 39199, 148065, 117354, 247028, 263101, 143302, 374509, 374511, 96850, 386410],
    KR: [619537, 619802, 531566, 619533, 660359, 1517098, 736824, 707622, 535790, 620873, 1185967, 421904],
    BR: [119581, 455278, 342577, 743415, 369380, 429234, 620873, 386410, 263101, 148065, 39199],
    ES: [74508, 388180, 2248, 624920, 492969, 669836, 9649, 778680, 86027, 117354]
  };
  
  const currentCountry = countryCode.toUpperCase();
  const regionalIds = regionalCollectionMap[currentCountry] || [];

  let regionalColls = allIds.filter(id => regionalIds.includes(id));
  let globalColls = allIds.filter(id => !regionalIds.includes(id));

  const getDailyRandom = () => {
    const d = new Date();
    let seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  };
  const rng = getDailyRandom();

  const shuffle = (array: any[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  regionalColls = shuffle(regionalColls);
  globalColls = shuffle(globalColls);

  const finalIds = [
    ...regionalColls.slice(0, 4),
    ...globalColls.slice(0, 15 - Math.min(regionalColls.length, 4))
  ];

  const rawCollections = await Promise.all(
    finalIds.map(id => tmdb.getCollection(id.toString()).catch(() => null))
  );
  
  const collectionsData = rawCollections.filter(Boolean).map(c => ({
    id: c.id,
    name: c.name.replace(' Collection', ''),
    backdrop: c.backdrop_path || (c.parts && c.parts.length > 0 ? c.parts[0].backdrop_path : null),
    poster: c.poster_path,
    movieCount: c.parts?.length || 0,
    tagline: taglines[c.id] || ''
  }));

  if (collectionsData.length === 0) return null;

  return <CollectionsRow collections={collectionsData} />;
}
