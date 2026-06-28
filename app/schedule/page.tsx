'use client';
import React, {
  useState, useEffect, useRef, useCallback, useMemo, Suspense,
} from 'react';
import { CalendarDays, Radio, Film, Tv, LayoutGrid, Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MediaCard } from '@/components/media/MediaCard';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { fetchScheduleAction, ScheduleParams } from '@/app/actions';
import { Media } from '@/types/tmdb';
import { useRouter, useSearchParams } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

type SidebarTab = 'released' | 'upcoming';
type TypeFilter = 'all' | 'movie' | 'tv';

interface DateGroup {
  dateKey: string;
  dayOfWeek: string;
  dayNum: string;
  month: string;
  year: string;
  items: Media[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const YEARS  = [2026, 2027, 2028, 2029, 2030];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const SIDEBAR_TABS = [
  { id: 'released' as SidebarTab, label: 'Released', Icon: CalendarDays },
  { id: 'upcoming' as SidebarTab, label: 'Upcoming', Icon: Radio },
];

// Country chips — no "all regions". Default: US, IN, JP
const COUNTRY_CHIPS = [
  { id: 'US', flag: '🇺🇸', label: 'USA' },
  { id: 'IN', flag: '🇮🇳', label: 'India' },
  { id: 'JP', flag: '🇯🇵', label: 'Japan' },
  { id: 'KR', flag: '🇰🇷', label: 'Korea' },
  { id: 'GB', flag: '🇬🇧', label: 'UK' },
  { id: 'FR', flag: '🇫🇷', label: 'France' },
  { id: 'DE', flag: '🇩🇪', label: 'Germany' },
  { id: 'ES', flag: '🇪🇸', label: 'Spain' },
  { id: 'IT', flag: '🇮🇹', label: 'Italy' },
  { id: 'CA', flag: '🇨🇦', label: 'Canada' },
  { id: 'AU', flag: '🇦🇺', label: 'Australia' },
  { id: 'CN', flag: '🇨🇳', label: 'China' },
];

const DEFAULT_COUNTRIES = ['US', 'IN', 'JP'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function localDateStr(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDateBounds(tab: SidebarTab, year: number, monthIdx: number): { gte: string; lte: string } {
  if (tab === 'released') {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(1);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    return { gte: localDateStr(twoMonthsAgo), lte: localDateStr() };
  }
  const startOfMonth = `${year}-${String(monthIdx + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, monthIdx + 1, 0).getDate();
  const endOfMonth = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const today = localDateStr();
  return { gte: today > startOfMonth ? today : startOfMonth, lte: endOfMonth };
}

function filterByTab(items: Media[], tab: SidebarTab): Media[] {
  const today = localDateStr();
  return items.filter(item => {
    const d = (item.release_date || item.first_air_date || '').substring(0, 10);
    if (!d) return false;
    if (tab === 'released') return d <= today;
    return d > today;
  });
}

function parseDateGroup(dateStr: string): Pick<DateGroup, 'dayOfWeek' | 'dayNum' | 'month' | 'year'> {
  const [y, mo, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, mo - 1, day, 12, 0, 0));
  return {
    dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toUpperCase(),
    dayNum: String(day).padStart(2, '0'),
    month: date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase(),
    year: String(y),
  };
}

function groupByDate(items: Media[], tab: SidebarTab): DateGroup[] {
  const map = new Map<string, Media[]>();
  for (const item of items) {
    const d = (item.release_date || item.first_air_date || '').substring(0, 10);
    if (!d) continue;
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(item);
  }
  const entries = Array.from(map.entries());
  entries.sort(([a], [b]) => tab === 'released' ? b.localeCompare(a) : a.localeCompare(b));
  return entries.map(([dateKey, groupItems]) => ({
    dateKey,
    ...parseDateGroup(dateKey),
    items: groupItems.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)),
  }));
}

function getSubLabel(item: Media, tab: SidebarTab): string {
  const year = (item.release_date || item.first_air_date || '').substring(0, 4);
  const suffix = year ? ` • ${year}` : '';
  if (item.media_type === 'movie') return tab === 'released' ? `Movie${suffix}` : `In Theatres${suffix}`;
  return `Series${suffix}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const ScheduleCard = React.memo(function ScheduleCard({ item, tab }: { item: Media; tab: SidebarTab }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <MediaCard media={item} isUpcoming={tab === 'upcoming'} hideTitle={true} />
      <div className="px-0.5 space-y-0.5">
        <p className="text-[13px] font-bold text-white/90 line-clamp-2 leading-snug">
          {item.title || item.name || ''}
        </p>
        <p className="text-[11px] font-medium text-white/40">{getSubLabel(item, tab)}</p>
      </div>
    </div>
  );
});

// Group block: ONE fade-in on the group, NOT per-card observers
const DateGroupBlock = React.memo(function DateGroupBlock({ group, tab, index }: { group: DateGroup; tab: SidebarTab; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="flex gap-5 md:gap-8 items-start w-full"
    >
      {/* Date Column — sticky */}
      <div className="shrink-0 w-12 md:w-16 pt-0.5 select-none sticky top-24 md:top-28 self-start z-10">
        <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest leading-none">{group.dayOfWeek}</p>
        <p className="text-3xl md:text-5xl font-black text-white leading-none mt-0.5 mb-0.5">{group.dayNum}</p>
        <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest">{group.month}</p>
      </div>

      {/* Card Grid */}
      <div className="flex-1 min-w-0 w-full">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4 w-full">
          {group.items.map(item => (
            <ScheduleCard key={`${item.media_type}-${item.id}`} item={item} tab={tab} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}, (prev, next) =>
  prev.group.items.length === next.group.items.length &&
  prev.group.dateKey === next.group.dateKey &&
  prev.tab === next.tab
);

function SkeletonGroup() {
  return (
    <div className="flex gap-5 md:gap-8 items-start w-full">
      {/* Date column */}
      <div className="shrink-0 w-12 md:w-16 flex flex-col gap-1.5 pt-1">
        <div className="h-2.5 w-7 rounded-sm" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="h-10 md:h-14 w-full rounded-lg" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <div className="h-2.5 w-7 rounded-sm" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>
      {/* Cards */}
      <div className="flex-1 min-w-0 w-full">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4 w-full">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 w-full" style={{ animationDelay: `${i * 60}ms` }}>
              <div
                className="w-full aspect-[2/3] rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',
                  animation: 'shimmer-skeleton 1.8s ease-in-out infinite',
                  animationDelay: `${i * 80}ms`,
                }}
              />
              <div className="h-3 rounded" style={{ width: `${70 + (i % 3) * 10}%`, background: 'rgba(255,255,255,0.05)' }} />
              <div className="h-2 rounded" style={{ width: `${40 + (i % 4) * 8}%`, background: 'rgba(255,255,255,0.04)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Country Tag Chip ─────────────────────────────────────────────────────────

function CountryChip({
  country, isActive, isLoading, onClick,
}: {
  country: typeof COUNTRY_CHIPS[0];
  isActive: boolean;
  isLoading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold
        border transition-all duration-200 whitespace-nowrap select-none
        ${isActive
          ? 'bg-white/12 border-white/25 text-white shadow-sm shadow-white/5'
          : 'bg-transparent border-white/10 text-white/45 hover:text-white/75 hover:border-white/20 hover:bg-white/5'
        }
      `}
    >
      <span className="text-sm leading-none">{country.flag}</span>
      <span>{country.label}</span>
      {isActive && !isLoading && (
        <span className="ml-0.5 w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center">
          <Check size={8} strokeWidth={3} />
        </span>
      )}
      {isLoading && (
        <span className="ml-0.5 w-3.5 h-3.5 rounded-full border border-white/40 border-t-transparent animate-spin" />
      )}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function SchedulePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mounted, setMounted]         = useState(false);
  const [sidebarTab, setSidebarTab]   = useState<SidebarTab>('released');
  const [typeFilter, setTypeFilter]   = useState<TypeFilter>('all');

  // Multi-select country tags
  const [activeCountries, setActiveCountries] = useState<string[]>(DEFAULT_COUNTRIES);

  const nowRef = useRef(new Date()); // Stable — not re-created on every render
  const [selectedYear, setSelectedYear]         = useState<number>(nowRef.current.getFullYear());
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(nowRef.current.getMonth());

  // Per-country media cache: { 'US': Media[], 'IN': Media[], ... }
  const countryCacheRef = useRef<Map<string, Media[]>>(new Map());
  // Per-country page & hasMore tracking
  const countryPageRef    = useRef<Map<string, number>>(new Map());
  const countryHasMoreRef = useRef<Map<string, boolean>>(new Map());
  // Countries currently being fetched
  const [loadingCountries, setLoadingCountries] = useState<Set<string>>(new Set());
  // Countries that have been fetched at least once
  const fetchedCountriesRef = useRef<Set<string>>(new Set());
  // In-flight fetch lock per country
  const fetchingRef = useRef<Set<string>>(new Set());

  // Initial loading state (before any data shown)
  const [initialLoading, setInitialLoading] = useState(true);
  // Loading-more spinner (bottom)
  const [loadingMore, setLoadingMore] = useState(false);
  // Visible days window (for lightweight DOM)
  const [visibleDays, setVisibleDays] = useState(4);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── Initialize from URL ────────────────────────────────────────────────────
  useEffect(() => {
    const tabParam = searchParams.get('tab') as SidebarTab;
    if (tabParam === 'released' || tabParam === 'upcoming') setSidebarTab(tabParam);
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Core fetch function — fetches ONE country ONE page ─────────────────────
  const fetchCountry = useCallback(async (
    country: string,
    pageNum: number,
    params: Pick<ScheduleParams, 'tab' | 'type' | 'gte' | 'lte'>,
    isInitial: boolean,
  ) => {
    if (fetchingRef.current.has(country)) return; // Debounce: skip if already in-flight
    fetchingRef.current.add(country);

    setLoadingCountries(prev => { const s = new Set(prev); s.add(country); return s; });

    try {
      const res = await fetchScheduleAction({ ...params, country, page: pageNum });
      const filtered = filterByTab(res.results || [], params.tab);

      // Update cache — append or replace
      const existing = countryCacheRef.current.get(country) || [];
      const merged = pageNum === 1 ? filtered : (() => {
        const seen = new Map(existing.map(i => [`${i.media_type}-${i.id}`, i]));
        filtered.forEach(i => seen.set(`${i.media_type}-${i.id}`, i));
        return Array.from(seen.values());
      })();

      countryCacheRef.current.set(country, merged);
      countryPageRef.current.set(country, pageNum);
      countryHasMoreRef.current.set(country, pageNum < res.total_pages);
      fetchedCountriesRef.current.add(country);
    } catch (err) {
      console.error(`[Schedule] Fetch failed for ${country} page ${pageNum}:`, err);
    } finally {
      fetchingRef.current.delete(country);
      setLoadingCountries(prev => { const s = new Set(prev); s.delete(country); return s; });
      if (isInitial) setInitialLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // ── Reset all caches when base parameters change ───────────────────────────
  const resetAndFetch = useCallback((
    countries: string[],
    tab: SidebarTab,
    type: TypeFilter,
    year: number,
    monthIdx: number,
  ) => {
    // Wipe all caches
    countryCacheRef.current.clear();
    countryPageRef.current.clear();
    countryHasMoreRef.current.clear();
    fetchedCountriesRef.current.clear();
    fetchingRef.current.clear();
    setVisibleDays(4);
    setInitialLoading(true);

    const { gte, lte } = getDateBounds(tab, year, monthIdx);
    const params = { tab, type, gte, lte };

    // Fetch countries sequentially with a small gap to avoid rate limits
    const fetchSequential = async () => {
      for (let i = 0; i < countries.length; i++) {
        const country = countries[i];
        await fetchCountry(country, 1, params, i === 0);
        if (i < countries.length - 1) {
          await new Promise(r => setTimeout(r, 150)); // 150ms gap
        }
      }
    };
    fetchSequential();
  }, [fetchCountry]);

  // Trigger reset when tab/type/year/month changes
  useEffect(() => {
    if (!mounted) return;
    resetAndFetch(activeCountries, sidebarTab, typeFilter, selectedYear, selectedMonthIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarTab, typeFilter, selectedYear, selectedMonthIdx, mounted]);

  // ── Handle country toggling ────────────────────────────────────────────────
  const handleCountryToggle = useCallback((countryId: string) => {
    setActiveCountries(prev => {
      const isCurrentlyActive = prev.includes(countryId);

      if (isCurrentlyActive) {
        // Deselect: must keep at least 1
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== countryId);
      } else {
        // Select: fetch if not cached
        const newList = [...prev, countryId];
        if (!fetchedCountriesRef.current.has(countryId)) {
          const { gte, lte } = getDateBounds(sidebarTab, selectedYear, selectedMonthIdx);
          fetchCountry(countryId, 1, { tab: sidebarTab, type: typeFilter, gte, lte }, false);
        }
        return newList;
      }
    });
    setVisibleDays(4);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarTab, typeFilter, selectedYear, selectedMonthIdx, fetchCountry]);

  // ── Merged items from active country caches ───────────────────────────────
  const mergedItems = useMemo(() => {
    const seen = new Set<string>();
    const result: Media[] = [];
    for (const country of activeCountries) {
      const items = countryCacheRef.current.get(country) || [];
      for (const item of items) {
        const key = `${item.media_type}-${item.id}`;
        if (!seen.has(key)) { seen.add(key); result.push(item); }
      }
    }
    return result;
    // We want this to recompute when loading changes (cache fills up)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCountries, loadingCountries]);

  const groups = useMemo(() => {
    return mounted ? groupByDate(mergedItems, sidebarTab) : [];
  }, [mounted, mergedItems, sidebarTab]);

  const visibleGroups = useMemo(() => groups.slice(0, visibleDays), [groups, visibleDays]);

  // Whether any active country still has more pages
  const hasMore = useMemo(() => {
    return activeCountries.some(c => countryHasMoreRef.current.get(c) !== false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCountries, loadingCountries]);

  // ── Infinite scroll observer ──────────────────────────────────────────────
  useEffect(() => {
    if (!mounted || initialLoading) return;
    const observer = new IntersectionObserver(
      entries => {
        if (!entries[0].isIntersecting) return;

        if (visibleDays < groups.length) {
          // Reveal more pre-fetched groups without any network request
          setVisibleDays(prev => prev + 4);
          return;
        }

        if (!hasMore) return;

        // Fetch next page for each active country that has more
        const { gte, lte } = getDateBounds(sidebarTab, selectedYear, selectedMonthIdx);
        const params = { tab: sidebarTab, type: typeFilter, gte, lte };

        setLoadingMore(true);
        const fetchNext = async () => {
          for (const country of activeCountries) {
            if (countryHasMoreRef.current.get(country) === false) continue;
            if (fetchingRef.current.has(country)) continue;
            const nextPage = (countryPageRef.current.get(country) || 1) + 1;
            await fetchCountry(country, nextPage, params, false);
            await new Promise(r => setTimeout(r, 150));
          }
          setLoadingMore(false);
        };
        fetchNext();
      },
      { rootMargin: '600px' },
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); observer.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, initialLoading, visibleDays, groups.length, hasMore, sidebarTab, typeFilter, selectedYear, selectedMonthIdx, activeCountries, fetchCountry]);

  const handleTabChange = (t: SidebarTab) => {
    if (t === sidebarTab) return;
    setSidebarTab(t);
    router.replace(`?tab=${t}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!mounted) return null;

  // ── Sidebar sections ──────────────────────────────────────────────────────

  const SidebarTabs = (
    <div className="flex flex-col gap-0.5">
      {SIDEBAR_TABS.map(({ id, label, Icon }) => {
        const isActive = sidebarTab === id;
        return (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-bold w-full text-left transition-all duration-200 ${
              isActive
                ? 'bg-white/10 text-white border border-white/12 shadow-sm'
                : 'text-white/45 hover:text-white/80 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Icon size={16} className={isActive ? 'text-brand-500' : 'text-white/30'} />
            {label}
          </button>
        );
      })}
    </div>
  );

  const YearMonthFilters = sidebarTab === 'upcoming' && (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1">Year</span>
        <div className="flex flex-wrap gap-1.5 px-1">
          {YEARS.map(y => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-all border ${
                selectedYear === y
                  ? 'bg-white text-black border-white'
                  : 'bg-white/5 border-white/8 text-white/55 hover:bg-white/10 hover:text-white/80'
              }`}
            >{y}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1">Month</span>
        <div className="grid grid-cols-3 gap-1.5 px-1">
          {MONTHS.map((m, i) => (
            <button
              key={m}
              onClick={() => setSelectedMonthIdx(i)}
              className={`py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                selectedMonthIdx === i
                  ? 'bg-white text-black border-white'
                  : 'bg-white/5 border-white/8 text-white/55 hover:bg-white/10 hover:text-white/80'
              }`}
            >{m}</button>
          ))}
        </div>
      </div>
    </div>
  );

  // Country section — full list that scrolls within its flex container
  const CountrySection = (
    <div className="flex flex-col gap-2.5 min-h-0 flex-1">
      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1.5 px-1 shrink-0">
        <Globe size={11} /> Countries
      </span>
      <div
        data-lenis-prevent="true"
        className="flex flex-col gap-1 overflow-y-auto pr-1 no-scrollbar pb-8"
        style={{ scrollbarWidth: 'none' }}
      >
        {COUNTRY_CHIPS.map(c => (
          <CountryChip
            key={c.id}
            country={c}
            isActive={activeCountries.includes(c.id)}
            isLoading={loadingCountries.has(c.id)}
            onClick={() => handleCountryToggle(c.id)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen pb-28 md:pb-20 w-full">
      {/* Fixed animated background — never scrolls */}
      <AnimatedBackground />

      <div className="relative z-10 max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 pt-[10vh] md:pt-[12vh] w-full">
        <div className="flex flex-col md:flex-row items-start gap-8 w-full">

          {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
          <aside className="hidden md:flex w-[185px] shrink-0 flex-col gap-6 sticky top-24 pb-4 self-start z-50 h-[calc(100vh-7rem)] overflow-hidden">
            {SidebarTabs}
            {YearMonthFilters}
            {CountrySection}
          </aside>

          {/* ── Main Content Area ────────────────────────────────────────── */}
          <div className="flex-1 w-full min-w-0">

            {/* Mobile Tab Row */}
            <div className="md:hidden flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
              {SIDEBAR_TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold whitespace-nowrap border transition-all ${
                    sidebarTab === id ? 'bg-white/10 border-white/12 text-white' : 'border-transparent text-white/50 bg-white/5'
                  }`}
                >
                  <Icon size={14} className={sidebarTab === id ? 'text-brand-500' : 'text-white/30'} />
                  {label}
                </button>
              ))}
            </div>

            {/* Mobile Year/Month */}
            {sidebarTab === 'upcoming' && (
              <div className="md:hidden flex flex-col gap-2 mb-4">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {YEARS.map(y => (
                    <button key={y} onClick={() => setSelectedYear(y)}
                      className={`px-3 py-1 rounded-lg text-[12px] font-bold whitespace-nowrap border ${selectedYear === y ? 'bg-white text-black border-white' : 'bg-white/5 border-white/8 text-white/55'}`}
                    >{y}</button>
                  ))}
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {MONTHS.map((m, i) => (
                    <button key={m} onClick={() => setSelectedMonthIdx(i)}
                      className={`px-3 py-1 rounded-lg text-[12px] font-bold whitespace-nowrap border ${selectedMonthIdx === i ? 'bg-white text-black border-white' : 'bg-white/5 border-white/8 text-white/55'}`}
                    >{m}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile Country Chips */}
            <div className="md:hidden flex gap-2 overflow-x-auto no-scrollbar mb-5 pb-1">
              {COUNTRY_CHIPS.map(c => (
                <CountryChip
                  key={c.id}
                  country={c}
                  isActive={activeCountries.includes(c.id)}
                  isLoading={loadingCountries.has(c.id)}
                  onClick={() => handleCountryToggle(c.id)}
                />
              ))}
            </div>

            {/* Type Filter Bar */}
            <div className="flex items-center gap-2 mb-7 md:mb-8">
              {([
                { id: 'all'   as TypeFilter, label: 'All',    Icon: LayoutGrid },
                { id: 'movie' as TypeFilter, label: 'Movies', Icon: Film },
                { id: 'tv'    as TypeFilter, label: 'Shows',  Icon: Tv },
              ]).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setTypeFilter(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all duration-200 border ${
                    typeFilter === id
                      ? 'bg-white text-black border-white shadow-md'
                      : 'bg-black/30 border-white/10 text-white/60 hover:text-white hover:border-white/25 hover:bg-white/5'
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}

              {/* Live loading badge */}
              <AnimatePresence>
                {loadingCountries.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="ml-auto flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full"
                  >
                    <div className="w-3 h-3 rounded-full border border-brand-500 border-t-transparent animate-spin" />
                    <span className="text-[11px] text-white/50 font-semibold">
                      Fetching {[...loadingCountries].map(c => COUNTRY_CHIPS.find(x => x.id === c)?.flag).join(' ')}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Main Content ─────────────────────────────────────────── */}
            <div className="min-h-[50vh] relative w-full">
              {initialLoading ? (
                <div className="flex flex-col gap-12 w-full">
                  <SkeletonGroup />
                  <SkeletonGroup />
                  <SkeletonGroup />
                </div>
              ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-32 text-center w-full">
                  <CalendarDays size={52} className="text-white/15 mb-5" />
                  <p className="text-xl font-black text-white/80 mb-2">No releases found</p>
                  <p className="text-sm text-white/40 max-w-sm">
                    Try selecting different countries, month, year, or content type.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-12 md:gap-16 w-full">
                  {visibleGroups.map((group, i) => (
                    <DateGroupBlock key={group.dateKey} group={group} tab={sidebarTab} index={i} />
                  ))}
                </div>
              )}
            </div>

            {/* Sentinel + load-more indicator */}
            <div ref={sentinelRef} className="flex justify-center items-center py-12 w-full">
              {loadingMore && (
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-full backdrop-blur-md">
                  <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                  <span className="text-[13px] font-bold text-white/60">Loading more...</span>
                </div>
              )}
              {!hasMore && !loadingMore && visibleDays >= groups.length && groups.length > 0 && (
                <p className="text-[12px] text-white/20 font-semibold tracking-wide">· All releases loaded ·</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

function ScheduleSkeleton() {
  return (
    <div className="relative min-h-screen w-full">
      <div className="fixed inset-0 bg-void-950 -z-20 pointer-events-none" />
      <div className="fixed top-0 left-0 right-0 h-screen bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-transparent -z-10 pointer-events-none" />
      <div className="relative z-10 max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 pt-[10vh] md:pt-[12vh] w-full">
        <div className="flex gap-8">
          <div className="hidden md:flex w-[185px] shrink-0 flex-col gap-3">
            <div className="h-12 rounded-xl animate-pulse bg-white/5" />
            <div className="h-12 rounded-xl animate-pulse bg-white/5" />
          </div>
          <div className="flex-1 flex flex-col gap-12 w-full min-w-0">
            <SkeletonGroup />
            <SkeletonGroup />
            <SkeletonGroup />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<ScheduleSkeleton />}>
      <SchedulePageContent />
    </Suspense>
  );
}
