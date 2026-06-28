const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const fetch = require('node-fetch');

async function searchCollection(query) {
  const url = `https://api.themoviedb.org/3/search/collection?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.results && data.results.length > 0) {
    console.log(`[${query}] ID: ${data.results[0].id} - ${data.results[0].name}`);
    return data.results[0].id;
  } else {
    console.log(`[${query}] Not found`);
  }
}

async function main() {
  // Global
  await searchCollection('Romance'); // Before Sunrise? Fifty Shades? Twilight?
  await searchCollection('Fifty Shades');
  await searchCollection('Twilight');
  await searchCollection('Before');
  await searchCollection('Spider-Man');
  await searchCollection('Deadpool');
  await searchCollection('Mad Max');

  // India
  await searchCollection('Baahubali');
  await searchCollection('Dhoom');
  await searchCollection('Krrish');
  await searchCollection('Golmaal');
  await searchCollection('Housefull');
  await searchCollection('Don');
  await searchCollection('Tiger');
  
  // Japan (Anime / Kaiju)
  await searchCollection('Evangelion');
  await searchCollection('Godzilla');
  await searchCollection('Gundam');
  await searchCollection('Dragon Ball Z');
  await searchCollection('Naruto');
  
  // Korea
  await searchCollection('Train to Busan');
  await searchCollection('The Roundup');
  await searchCollection('Oldboy'); // Vengeance trilogy?
  await searchCollection('Vengeance');

  // Spanish / Mexican / Brazil
  await searchCollection('Elite'); // Not collection?
  await searchCollection('Tropa de Elite');
}

main();
