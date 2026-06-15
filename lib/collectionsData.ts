import { tmdb } from './tmdb';

export const COLLECTION_CATEGORIES: Record<string, number[]> = {
  'Action & Adventure': [
    131292, // Marvel Cinematic Universe
    86311, // The Avengers
    263, // The Dark Knight
    87359, // Mission: Impossible
    645, // James Bond
    9485, // Fast & Furious
    404609, // John Wick
    1570, // The Bourne
    84, // Indiana Jones
    948, // Die Hard
    119, // The Lord of the Rings
    1241, // Harry Potter
    10, // Star Wars
    307080, // Star Wars Skywalker Saga
    380064, // Star Trek (Kelvin Timeline)
    31322, // The Expendables
    13444, // Spider-Man (Sam Raimi)
    531241, // Spider-Man (Tom Holland)
    556, // Spider-Man (The Amazing)
    528, // The Terminator
    9366, // Rocky
    173710, // Planet of the Apes (Reboot)
    8251, // Planet of the Apes (Original)
    13448, // The Matrix
    328, // Jurassic Park
    102279, // The Hunger Games
    203204, // The Maze Runner
    133869, // Divergent
    384462, // The Purge
  ],
  'Sci-Fi & Fantasy': [
    119, // The Lord of the Rings
    835560, // The Hobbit
    1241, // Harry Potter
    33514, // Fantastic Beasts
    10, // Star Wars Original
    131292, // MCU
    2344, // The Matrix
    528, // Terminator
    328, // Jurassic Park
    380064, // Star Trek
    120794, // Godzilla
    531330, // MonsterVerse
    173710, // Planet of the Apes
    118, // Transformers
    40810, // Alien
    280, // Predator
    535181, // Dune
    643534, // Avatar
    405441, // Pacific Rim
    136437, // Riddick
    325852, // Mad Max
    124976, // Tron
    261623, // Independence Day
  ],
  'Animation': [
    10194, // Toy Story
    1734, // Shrek
    113426, // Despicable Me
    360416, // Kung Fu Panda
    113645, // How to Train Your Dragon
    58129, // Cars
    630138, // The Incredibles
    275990, // Monsters, Inc.
    391129, // Finding Nemo
    605481, // Frozen
    88065, // Ice Age
    200424, // Madagascar
    170821, // Hotel Transylvania
    862121, // Spider-Verse
    408992, // The Secret Life of Pets
    325883, // Sing
    526017, // The Lego Movie
  ],
  'Horror & Thriller': [
    109018, // The Conjuring
    449258, // Annabelle
    56637, // Scream
    135261, // Halloween
    118, // Saw
    59253, // Final Destination
    361099, // The Purge
    92882, // Paranormal Activity
    175658, // Insidious
    432135, // A Quiet Place
    456942, // It
    2599, // The Exorcist
    135262, // A Nightmare on Elm Street
    135265, // Friday the 13th
    135263, // Child's Play / Chucky
    90666, // Resident Evil
    3838, // Underworld
    40810, // Alien
  ],
  'Comedy & Family': [
    106519, // The Hangover
    391557, // Bad Boys
    89314, // Scary Movie
    106191, // Men in Black
    136473, // Jump Street
    9214, // American Pie
    257530, // Pitch Perfect
    487382, // Deadpool
    119561, // Ghostbusters
    118742, // Rush Hour
    115049, // Meet the Parents
    90104, // Austin Powers
    133917, // Night at the Museum
    328509, // Ride Along
    91456, // The Naked Gun
  ],
  'Crime & Drama': [
    230, // The Godfather
    163459, // The Twilight Saga
    1032, // The Rocky
    31100, // Oceans
    101683, // The Millennium Trilogy (Girl with Dragon Tattoo)
    897364, // Knives Out
    800451, // Kingsman
    374944, // Now You See Me
    326305, // Sicario
    325076, // Creed
  ]
};

export async function getCuratedCollections() {
  const collectionIds = [
    263, 119, 230, 131292, 1241, 84, 10, 404609, 87359, 645, 2344, 328, 10194, 173710, 9485,
    350309, 44976, 246091, 619537, 210303, 131635, 8650, 295, 531330
  ];
  const rawCollections = await Promise.all(collectionIds.map(id => tmdb.getCollection(id.toString())));
  
  const CURATED_TAGLINES: Record<number, string> = {
    263: "Nolan's definitive superhero epic", 119: "The greatest fantasy trilogy", 230: "Cinema's greatest achievement",
    131292: "The ultimate connected universe", 1241: "The boy who lived", 84: "The original adventure hero",
    10: "Where it all began", 404609: "Modern action at its finest", 87359: "The best ongoing action franchise",
    645: "60 years of the greatest spy", 2344: "The sci-fi landmark", 328: "30 years of dino carnage",
    10194: "Pixar's timeless masterpiece", 173710: "The reboot done right", 9485: "Family. Always.",
    350309: "India's greatest epic", 44976: "High-octane Bollywood heist", 246091: "India's beloved superhero",
    619537: "Korean zombie masterpiece", 210303: "Japanese mecha phenomenon", 131635: "May the odds be ever in your favor",
    8650: "Robots in disguise", 295: "A pirate's life for me", 531330: "The titans clash"
  };

  return rawCollections.filter(Boolean).map(c => ({
    id: c.id,
    name: c.name.replace(' Collection', ''), // Clean up name
    backdrop: c.backdrop_path,
    poster: c.poster_path,
    movieCount: c.parts?.length || 0,
    tagline: CURATED_TAGLINES[c.id] || ''
  }));
}
