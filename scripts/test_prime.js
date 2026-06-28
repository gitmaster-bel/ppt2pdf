const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const fetch = require('node-fetch');

const run = async () => {
    const key = process.env.TMDB_API_KEY;
    console.log("Checking Prime Video (9) for IN");
    const r1 = await fetch(`https://api.themoviedb.org/3/discover/movie?with_watch_providers=9&watch_region=IN&with_origin_country=IN&api_key=${key}`).then(r => r.json());
    console.log("Total results for 9:", r1.total_results);

    console.log("Checking Prime Video (119) for IN");
    const r2 = await fetch(`https://api.themoviedb.org/3/discover/movie?with_watch_providers=119&watch_region=IN&with_origin_country=IN&api_key=${key}`).then(r => r.json());
    console.log("Total results for 119:", r2.total_results);
}
run();
