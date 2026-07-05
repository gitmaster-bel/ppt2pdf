export interface Source {
  id: string;
  name: string;         // Display name shown in Settings modal
  publicName: string;   // Name shown on player top bar (hides real URL-based name for top 7)
  type: "iframe" | "api";
  tier: 1 | 2;
  feature: string;
  hasPopups: boolean;
  noAds: boolean;
  hasLanguageOptions?: boolean;
  autoDisableSandbox?: boolean; // e.g. peachify needs sandbox off
  sandboxFlags: string;
  url: (
    type: "movie" | "tv",
    id: string,
    season?: number,
    episode?: number,
    themeHex?: string,
    lang?: string
  ) => string;
}

export const NORMAL_SANDBOX = "allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock allow-downloads allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation";
export const TIER_1_SANDBOX = NORMAL_SANDBOX;
export const TIER_2_SANDBOX = NORMAL_SANDBOX;

// TOP 8 — shown as "Server 1" through "Server 8" on the player top bar
// Their real names are only revealed inside the Settings modal
export const sources: Source[] = [
  {
    id: "allyoucanwatch",
    name: "AllYouCanWatch",
    publicName: "Server 1",
    type: "iframe",
    tier: 1,
    feature: "Ultra-fast premium streams · Zero ads · Crisp 1080p",
    hasPopups: false,
    noAds: true,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://allyoucanwatch.net/player/new_player.html?tmdb=${id}&prefServer=auto&prefQuality=auto`
        : `https://allyoucanwatch.net/player/new_player.html?tmdb=${id}&type=series&s=${season}&e=${episode}&prefServer=auto&prefQuality=auto`
  },
  {
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
        ? `https://web.nxsha.app/embed/movie/${id}?lang=${lang || 'en'}&autoplay=true`
        : `https://web.nxsha.app/embed/tv/${id}/${season}/${episode}?lang=${lang || 'en'}&autoplay=true`
  },
  {
    id: "vidnest",
    name: "VidNest",
    publicName: "Server 3 ⚡",
    type: "iframe",
    tier: 1,
    feature: "Very fast",
    hasPopups: false,
    noAds: false,
    autoDisableSandbox: true,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://vidnest.fun/movie/${id}`
        : `https://vidnest.fun/tv/${id}/${season}/${episode}`
  },
  {
    id: "vidsrcwtf1",
    name: "VidSrc Multi-Server",
    publicName: "Server 4",
    type: "iframe",
    tier: 1,
    feature: "Aggregates multiple servers automatically · Switches to best source · Zero ads",
    hasPopups: false,
    noAds: true,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://vidsrc.wtf/1/movie/${id}?color=${themeHex || '7c3aed'}`
        : `https://vidsrc.wtf/1/tv/${id}/${season}/${episode}?color=${themeHex || '7c3aed'}`
  },
  {
    id: "peachify",
    name: "Peachify",
    publicName: "Server 5",
    type: "iframe",
    tier: 1,
    feature: "Multilingual subtitles & dubs · Smart fallbacks · Works well on mobile — Note: may show ads/redirects",
    hasPopups: true,
    noAds: false,
    autoDisableSandbox: true, // Sandbox auto-disabled for this server
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://peachify.top/embed/movie/${id}?accent=${themeHex || '7c3aed'}`
        : `https://peachify.top/embed/tv/${id}/${season}/${episode}?accent=${themeHex || '7c3aed'}`
  },
  {
    id: "vidsuper",
    name: "VidSuper",
    publicName: "Server 6",
    type: "iframe",
    tier: 1,
    feature: "High quality streams · No ads · Skip intro supported",
    hasPopups: false,
    noAds: true,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://vidsuper.net/movie/${id}?color=${themeHex || '7c3aed'}&overlay=true`
        : `https://vidsuper.net/tv/${id}/${season}/${episode}?color=${themeHex || '7c3aed'}&overlay=true&skip_intro=true&nextEpisode=true`
  },
  {
    id: "vidsrcwtf2",
    name: "VidSrc Multi-Lang",
    publicName: "Server 7",
    type: "iframe",
    tier: 1,
    feature: "Extensive multi-language subtitles & dubs · Great for international content · Zero ads",
    hasPopups: false,
    noAds: true,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://vidsrc.wtf/2/movie/${id}?color=${themeHex || '7c3aed'}`
        : `https://vidsrc.wtf/2/tv/${id}/${season}/${episode}?color=${themeHex || '7c3aed'}`
  },
  {
    id: "screenscape",
    name: "ScreenScape",
    publicName: "Server 8",
    type: "iframe",
    tier: 1,
    feature: "Fast, many dubs available, Ad-free",
    hasPopups: false,
    noAds: true,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://screenscape.me/embed?tmdb=${id}&type=movie`
        : `https://screenscape.me/embed?tmdb=${id}&type=tv&s=${season}&e=${episode}`
  },
  {
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
        ? `https://spencerdevs.xyz/movie/${id}`
        : `https://spencerdevs.xyz/tv/${id}/${season}/${episode}`
  },
  {
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
        ? `https://1embed.cc/embed/movie/${id}`
        : `https://1embed.cc/embed/tv/${id}/${season}/${episode}`
  },
  {
    id: "vidlux",
    name: "VidLux",
    publicName: "Server 11",
    type: "iframe",
    tier: 1,
    feature: "Good, fast, Ad-free",
    hasPopups: false,
    noAds: true,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://vidlux.xyz/embed/movie/${id}`
        : `https://vidlux.xyz/embed/tv/${id}/${season}/${episode}`
  },
  {
    id: "smashystream",
    name: "SmashyStream",
    publicName: "Server 12",
    type: "iframe",
    tier: 1,
    feature: "Extensive backup links · Multi-language subtitles · High uptime · Good fallback option",
    hasPopups: true,
    noAds: true,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://embed.smashystream.com/playere.php?tmdb=${id}&color=${themeHex || '7c3aed'}`
        : `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${season}&episode=${episode}&color=${themeHex || '7c3aed'}`
  },
  {
    id: "cinesrc",
    name: "CineSrc",
    publicName: "Server 13",
    type: "iframe",
    tier: 1,
    feature: "Auto-play enabled · Premium servers · Ad-free · Reliable uptime · Great for TV shows",
    hasPopups: false,
    noAds: true,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://cinesrc.st/embed/movie/${id}?color=%23${themeHex || '7c3aed'}&autoplay=true`
        : `https://cinesrc.st/embed/tv/${id}?s=${season}&e=${episode}&color=%23${themeHex || '7c3aed'}&autoplay=true`
  },
  // ── Additional Servers (shown with real names) ───────────────────────────
  {
    id: "filmu",
    name: "Filmu",
    publicName: "Filmu",
    type: "iframe",
    tier: 1,
    feature: "High quality streams · Zero ads",
    hasPopups: false,
    noAds: true,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://embed.filmu.in/movie/${id}?autoplay=true`
        : `https://embed.filmu.in/tv/${id}/${season}/${episode}?autoplay=true`
  },
  {
    id: "nextgencloudfabric",
    name: "NextGenCloud",
    publicName: "NextGenCloud",
    type: "iframe",
    tier: 1,
    feature: "Cloud streamed content",
    hasPopups: false,
    noAds: true,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://nextgencloudfabric.com/embed/movie/${id}`
        : `https://nextgencloudfabric.com/embed/tv/${id}/${season}/${episode}`
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    publicName: "AutoEmbed",
    type: "iframe",
    tier: 1,
    feature: "TMDB exact-match engine · Zero ads · Instant source selection · Wide library coverage",
    hasPopups: false,
    noAds: true,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://autoembed.co/movie/tmdb/${id}?color=${themeHex || '7c3aed'}`
        : `https://autoembed.co/tv/tmdb/${id}-${season}-${episode}?color=${themeHex || '7c3aed'}`
  },
  {
    id: "cinemaos",
    name: "CinemaOS",
    publicName: "CinemaOS",
    type: "iframe",
    tier: 1,
    feature: "Ultra-fast premium streams · Zero ads · Crisp 1080p · No popups · Best for movies",
    hasPopups: false,
    noAds: true,
    autoDisableSandbox: true,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://cinemaos.tech/player/${id}?theme=${themeHex || '7c3aed'}`
        : `https://cinemaos.tech/player/${id}/${season}/${episode}?theme=${themeHex || '7c3aed'}`
  },
  {
    id: "mappletv",
    name: "MappleTV",
    publicName: "MappleTV",
    type: "iframe",
    tier: 1,
    feature: "HD streams with consistent uptime",
    hasPopups: false,
    noAds: false,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://mapple.uk/watch/movie/${id}`
        : `https://mapple.uk/watch/tv/${id}-${season}-${episode}`
  },
  {
    id: "111movies",
    name: "111Movies",
    publicName: "111Movies",
    type: "iframe",
    tier: 1,
    feature: "Fast global CDN, auto-selects highest quality",
    hasPopups: true,
    noAds: false,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://111movies.net/movie/${id}?color=${themeHex || '7c3aed'}`
        : `https://111movies.net/tv/${id}/${season}/${episode}?color=${themeHex || '7c3aed'}`
  },
  {
    id: "rivestream",
    name: "RiveStream",
    publicName: "RiveStream",
    type: "iframe",
    tier: 1,
    feature: "Powerful aggregator with Best Server mode",
    hasPopups: false,
    noAds: false,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://rivestream.ru/embed?type=movie&id=${id}&agg=2`
        : `https://rivestream.ru/embed?type=tv&id=${id}&season=${season}&episode=${episode}&agg=2`
  },
  {
    id: "vidking",
    name: "VidKing",
    publicName: "VidKing",
    type: "iframe",
    tier: 1,
    feature: "High-bitrate streams & lightning-fast loading",
    hasPopups: false,
    noAds: false,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://www.vidking.net/embed/movie/${id}?color=${themeHex || '7c3aed'}`
        : `https://www.vidking.net/embed/tv/${id}/${season}/${episode}?color=${themeHex || '7c3aed'}`
  },
  {
    id: "vixsrc",
    name: "VixSrc",
    publicName: "VixSrc",
    type: "iframe",
    tier: 1,
    feature: "Clean API, rapid fetching, high uptime",
    hasPopups: false,
    noAds: false,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://vixsrc.to/embed/movie/${id}`
        : `https://vixsrc.to/embed/tv/${id}/${season}/${episode}`
  },
  {
    id: "embedmaster",
    name: "EmbedMaster",
    publicName: "EmbedMaster",
    type: "iframe",
    tier: 1,
    feature: "Versatile sources, robust custom player",
    hasPopups: true,
    noAds: false,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://embedmaster.link/movie/${id}`
        : `https://embedmaster.link/tv/${id}/${season}/${episode}`
  },
  {
    id: "vidzee",
    name: "Vidzee",
    publicName: "Vidzee",
    type: "iframe",
    tier: 1,
    feature: "Ultra-fast direct MP4 streaming",
    hasPopups: false,
    noAds: false,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://player.vidzee.wtf/embed/movie/${id}?color=${themeHex || '7c3aed'}`
        : `https://player.vidzee.wtf/embed/tv/${id}/${season}/${episode}?color=${themeHex || '7c3aed'}`
  },
  {
    id: "vidfast",
    name: "Vidfast",
    publicName: "Vidfast",
    type: "iframe",
    tier: 1,
    feature: "Low latency, optimized for all devices",
    hasPopups: false,
    noAds: false,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://vidfast.pro/movie/${id}?color=${themeHex || '7c3aed'}`
        : `https://vidfast.pro/tv/${id}/${season}/${episode}?color=${themeHex || '7c3aed'}`
  },
  {
    id: "nontongo",
    name: "NontonGo",
    publicName: "NontonGo",
    type: "iframe",
    tier: 1,
    feature: "Active streaming API, fast, multiple sources",
    hasPopups: false,
    noAds: false,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://www.nontongo.win/embed/movie/${id}`
        : `https://www.nontongo.win/embed/tv/${id}/${season}/${episode}`
  },
  {
    id: "vidcore",
    name: "VidCore",
    publicName: "VidCore",
    type: "iframe",
    tier: 1,
    feature: "Blazing fast streaming, next-gen infrastructure",
    hasPopups: false,
    noAds: false,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://vidcore.net/embed/movie/${id}`
        : `https://vidcore.net/embed/tv/${id}/${season}/${episode}`
  },
  {
    id: "vidsrcwtf3",
    name: "VidSrc Multi-Embeds",
    publicName: "VidSrc Multi-Embeds",
    type: "iframe",
    tier: 1,
    feature: "Multiple robust embed fallback options",
    hasPopups: false,
    noAds: false,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://vidsrc.wtf/3/movie/${id}?color=${themeHex || '7c3aed'}`
        : `https://vidsrc.wtf/3/tv/${id}/${season}/${episode}?color=${themeHex || '7c3aed'}`
  },
  {
    id: "vidsrcwtf4",
    name: "VidSrc Premium",
    publicName: "VidSrc Premium",
    type: "iframe",
    tier: 1,
    feature: "Top-tier bandwidth with premium servers",
    hasPopups: false,
    noAds: false,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://vidsrc.wtf/4/movie/${id}?color=${themeHex || '7c3aed'}`
        : `https://vidsrc.wtf/4/tv/${id}/${season}/${episode}?color=${themeHex || '7c3aed'}`
  },
  {
    id: "vidrock",
    name: "VidRock",
    publicName: "VidRock",
    type: "iframe",
    tier: 1,
    feature: "Stable high quality Russian backend",
    hasPopups: false,
    noAds: false,
    sandboxFlags: TIER_1_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://vidrock.ru/embed/movie/${id}`
        : `https://vidrock.ru/embed/tv/${id}/${season}/${episode}`
  },
  {
    id: "vidlink",
    name: "VidLink",
    publicName: "VidLink",
    type: "iframe",
    tier: 2,
    feature: "Vast legacy library, reliable fallbacks",
    hasPopups: true,
    noAds: false,
    sandboxFlags: TIER_2_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://vidlink.pro/movie/${id}?autoplay=false&primaryColor=${themeHex || '7c3aed'}`
        : `https://vidlink.pro/tv/${id}/${season}/${episode}?autoplay=false&primaryColor=${themeHex || '7c3aed'}`
  },
  {
    id: "vidsrcme",
    name: "VidSrc.me",
    publicName: "VidSrc.me",
    type: "iframe",
    tier: 2,
    feature: "Massive library, decent speed",
    hasPopups: true,
    noAds: false,
    sandboxFlags: TIER_2_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://vidsrc.me/embed/movie/${id}?color=${themeHex || '7c3aed'}`
        : `https://vidsrc.me/embed/tv/${id}/${season}/${episode}?color=${themeHex || '7c3aed'}`
  },
  {
    id: "vidsrcto",
    name: "VidSrc.to",
    publicName: "VidSrc.to",
    type: "iframe",
    tier: 2,
    feature: "Secondary massive catalog fallback",
    hasPopups: true,
    noAds: false,
    sandboxFlags: TIER_2_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://vidsrc.to/embed/movie/${id}?color=${themeHex || '7c3aed'}`
        : `https://vidsrc.to/embed/tv/${id}/${season}/${episode}?color=${themeHex || '7c3aed'}`
  },
  {
    id: "videasy",
    name: "VidEasy",
    publicName: "VidEasy",
    type: "iframe",
    tier: 2,
    feature: "Lightweight player, good fallbacks",
    hasPopups: false,
    noAds: false,
    sandboxFlags: TIER_2_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://player.videasy.net/movie/${id}?color=${themeHex || '7c3aed'}`
        : `https://player.videasy.net/tv/${id}/${season}/${episode}?color=${themeHex || '7c3aed'}`
  },
  {
    id: "2embed",
    name: "2Embed",
    publicName: "2Embed",
    type: "iframe",
    tier: 2,
    feature: "Varied quality streams & alternatives",
    hasPopups: true,
    noAds: false,
    sandboxFlags: TIER_2_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://www.2embed.cc/embed/${id}?color=${themeHex || '7c3aed'}`
        : `https://www.2embed.cc/embedtv/${id}?s=${season}&e=${episode}&color=${themeHex || '7c3aed'}`
  },
  {
    id: "bcine",
    name: "BCine",
    publicName: "BCine",
    type: "iframe",
    tier: 2,
    feature: "Reliable fallback proxy",
    hasPopups: true,
    noAds: false,
    sandboxFlags: TIER_2_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://bcine.ru/embed/movie/${id}`
        : `https://bcine.ru/embed/tv/${id}/${season}/${episode}`
  },
  {
    id: "vidsync",
    name: "VidSync",
    publicName: "VidSync",
    type: "iframe",
    tier: 2,
    feature: "Fast, okay reliability, but has too many ads",
    hasPopups: true,
    noAds: false,
    autoDisableSandbox: true,
    sandboxFlags: TIER_2_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://vidsync.xyz/embed/movie/${id}`
        : `https://vidsync.xyz/embed/tv/${id}/${season}/${episode}`
  },
  {
    id: "vidsrcxyz",
    name: "VidSrc.xyz",
    publicName: "VidSrc.xyz",
    type: "iframe",
    tier: 2,
    feature: "Alternative VidSrc mirror",
    hasPopups: true,
    noAds: false,
    sandboxFlags: TIER_2_SANDBOX,
    url: (type, id, season, episode, themeHex, lang) =>
      type === "movie"
        ? `https://vidsrc.xyz/embed/movie/${id}?color=${themeHex || '7c3aed'}`
        : `https://vidsrc.xyz/embed/tv/${id}/${season}/${episode}?color=${themeHex || '7c3aed'}`
  }
];

export const TOP_8_IDS = ["allyoucanwatch", "nxsha", "vidnest", "vidsrcwtf1", "peachify", "vidsuper", "vidsrcwtf2", "screenscape"];
/** Servers 9-11 appear in the Settings "Recommended" section but NOT in the quick-switch header strip */
export const EXTENDED_TOP_IDS = [...TOP_8_IDS, "spencerdevs", "1embed", "vidlux", "smashystream", "cinesrc"];

export const getSource = (id?: string): Source =>
  sources.find((s) => s.id === id) || sources[0];

// ── Server codenames for URL sharing ─────────────────────────────────────────
// Real server IDs are NEVER exposed in shared links.
// ?server=alpha, ?server=beta etc. are what users see.
const SERVER_CODENAMES: Record<string, string> = {
  // Top 8
  'allyoucanwatch': 'alpha',
  'cinemaos':     'gamma',
  'filmu':        'zeta',
  'nextgencloudfabric': 'theta',
  'nxsha':        'kappa',
  'cinesrc':      'beta',
  'vidsrcwtf1':   'nova',
  'peachify':     'delta',
  'vidsuper':     'echo',
  'autoembed':    'omega3',
  'vidsrcwtf2':   'sigma',
  'smashystream': 'omega',
  'vidnest':      'nebula',
  'vidlux':       'lyra',
  'screenscape':  'orion',
  '1embed':       'flare',
  // Additional servers
  'spencerdevs': 'sirius',
  'mappletv':     'mars',
  '111movies':    'saturn',
  'rivestream':   'venus',
  'vidking':      'titan',
  'vixsrc':       'pluto',
  'embedmaster':  'orbit',
  'vidzee':       'comet',
  'vidfast':      'pulsar',
  'nontongo':     'quasar',
  'vidcore':      'zenith',
  'vidsrcwtf3':   'nexus',
  'vidsrcwtf4':   'apex',
  'vidrock':      'forge',
  'vidlink':      'relay',
  'vidsrcme':     'vault',
  'vidsrcto':     'prism',
  'videasy':      'pixel',
  '2embed':       'surge',
  'bcine':        'aura',
  'vidsync':      'pulse',
  'vidsrcxyz':    'spark',
};

// Reverse lookup: codename → real id
const CODENAME_TO_SERVER: Record<string, string> = Object.fromEntries(
  Object.entries(SERVER_CODENAMES).map(([realId, code]) => [code, realId])
);

/** Convert a real server id → URL-safe codename */
export function encodeServer(realId: string): string {
  return SERVER_CODENAMES[realId] ?? realId;
}

/** Convert a URL codename → real server id */
export function decodeServer(code: string): string {
  return CODENAME_TO_SERVER[code] ?? code;
}
