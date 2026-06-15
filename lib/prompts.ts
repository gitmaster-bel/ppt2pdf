export const AI_PROMPTS = [
  // Basic
  { text: "good action movies", tags: ["Basic", "Genre"], description: "Simple genre search." },
  { text: "funny comedy shows", tags: ["Basic", "Genre", "TV"], description: "Finds comedy TV series." },
  { text: "scary horror movies", tags: ["Basic", "Genre"], description: "Simple horror movies search." },
  { text: "romantic movies", tags: ["Basic", "Genre"], description: "Simple romance movies search." },
  { text: "popular sci-fi movies", tags: ["Basic", "Popular", "Genre"], description: "Popular science fiction." },
  { text: "best anime series", tags: ["Basic", "Anime", "Rating"], description: "Top rated anime shows." },
  { text: "new action movies", tags: ["Basic", "New", "Genre"], description: "Recently released action." },
  { text: "classic westerns", tags: ["Basic", "Classic", "Genre"], description: "Classic western movies." },
  { text: "thriller movies", tags: ["Basic", "Genre"], description: "Simple thriller movies search." },
  { text: "family friendly movies", tags: ["Basic", "Family", "Genre"], description: "Movies suitable for the whole family." },
  
  // Good
  { text: "action movies from 2023", tags: ["Good", "Genre", "Year"], description: "Action movies from a specific year." },
  { text: "top rated comedy movies 2020s", tags: ["Good", "Rating", "Genre", "Decade"], description: "Highly rated comedies from this decade." },
  { text: "korean thriller series", tags: ["Good", "Language", "Genre"], description: "Thriller series from South Korea." },
  { text: "movies like Inception", tags: ["Good", "Similarity"], description: "Recommendations based on a specific movie." },
  { text: "shows similar to Breaking Bad", tags: ["Good", "Similarity"], description: "Recommendations based on a specific TV show." },
  { text: "funny animated movies for kids", tags: ["Good", "Genre", "Family"], description: "Family friendly animated comedies." },
  { text: "dark fantasy anime", tags: ["Good", "Anime", "Tone"], description: "Anime with a dark fantasy theme." },
  { text: "best documentaries about space", tags: ["Good", "Documentary", "Topic"], description: "Highly rated documentaries on a specific subject." },
  { text: "popular British crime shows", tags: ["Good", "Region", "Genre"], description: "Well-known crime series from the UK." },
  { text: "romantic comedies starring Ryan Gosling", tags: ["Good", "Actor", "Genre"], description: "Movies featuring a specific actor in a certain genre." },
  
  // Very Good
  { text: "underrated 90s sci-fi movies similar to The Matrix", tags: ["Very Good", "Decade", "Similarity", "Underrated"], description: "Filters by release decade, sci-fi genre, similar movies, and underrated quality." },
  { text: "top rated classic French romantic comedy films from 80s", tags: ["Very Good", "Classic", "Language", "Decade"], description: "French films from the 1980s, combining romance/comedy, sorted by highest rating." },
  { text: "popular action sci-fi shows like Stranger Things", tags: ["Very Good", "Popular", "Genres", "Similarity"], description: "Popularity-based recommendation for action/sci-fi TV series resembling a specific title." },
  { text: "best Korean drama series with high rating from 2020s", tags: ["Very Good", "Rating", "Language", "Decade"], description: "Top-rated Korean drama series released in the current decade." },
  { text: "underrated Japanese anime movies similar to Naruto before 2010", tags: ["Very Good", "Underrated", "Anime", "Similarity", "Year"], description: "Year constraints, anime genre, similarity, and rating filters." },
  { text: "best Hindi action thriller movies starring Nawazuddin Siddiqui in 2010s", tags: ["Very Good", "Actor", "Language", "Decade", "Rating"], description: "Combines cast credits, multiple genres, native language, decade ranges, and high rating sorting." },
  { text: "movies directed by Christopher Nolan in the 2010s", tags: ["Very Good", "Director", "Decade"], description: "Finds movies where Nolan is credited in directing department, filtered to the 2010s." },
  { text: "adult erotic thriller movies starring Sharon Stone from 1990s", tags: ["Very Good", "Adult", "Actor", "Decade"], description: "Unlocks adult content filter, matching specified actor and genre within the 1990s." },
  { text: "visually stunning epic fantasy movies with female leads released after 2015", tags: ["Very Good", "Visuals", "Theme", "Year"], description: "Searches for high visual quality, epic scale fantasy, and a strict release window." },
  
  // Expert
  { text: "critically acclaimed psychological horror movies from the 70s with a slow burn", tags: ["Expert", "Rating", "Subgenre", "Pacing"], description: "Deep niche search combining high critical acclaim, specific horror subgenre, era, and pacing." },
  { text: "obscure cyberpunk anime OVAs from the late 80s similar to Akira", tags: ["Expert", "Obscure", "Subgenre", "Similarity"], description: "Highly specific search for obscure direct-to-video anime in a niche subgenre." },
  { text: "award-winning independent coming-of-age dramas directed by women", tags: ["Expert", "Awards", "Indie", "Director"], description: "Combines award recognition, production scale, thematic subgenre, and director demographics." },
  { text: "gritty neo-noir detective shows set in rainy cities like Blade Runner", tags: ["Expert", "Tone", "Setting", "Similarity"], description: "Matches specific tone, atmospheric setting, and draws similarity to a well-known title." },
  { text: "feel-good slice-of-life Japanese dramas about cooking and food", tags: ["Expert", "Tone", "Subgenre", "Theme"], description: "Finds uplifting Japanese series focusing on a highly specific theme like culinary arts." },
  { text: "mind-bending time travel thrillers with unexpected plot twists", tags: ["Expert", "Theme", "Subgenre", "Plot"], description: "Searches for complex narratives involving time travel and specific plot structures." },
  { text: "atmospheric Scandinavian noir crime series from the last 5 years", tags: ["Expert", "Atmosphere", "Region", "Recent"], description: "Pinpoints the 'Nordic Noir' genre within a recent timeframe." },
  { text: "heartwarming British period piece romantic comedies", tags: ["Expert", "Tone", "Region", "Setting"], description: "Combines emotional tone, country of origin, historical setting, and genre." },
  { text: "fast-paced martial arts action movies from Hong Kong before 2000", tags: ["Expert", "Pacing", "Region", "Era"], description: "Specific regional cinema search combining pacing, subgenre, and a cutoff year." },
  { text: "surrealist European art-house films that explore existential themes", tags: ["Expert", "Style", "Region", "Theme"], description: "Deep dive into avant-garde European cinema focusing on specific philosophical themes." }
];
