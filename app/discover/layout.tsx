export const metadata = {
  title: 'Discover Movies & Shows',
  description: 'Explore and discover thousands of movies and TV shows on ZIVOX. Filter by genre, rating, year, and more. Find your next favorite watch.',
  openGraph: {
    title: 'Discover Movies & Shows — ZIVOX',
    description: 'Explore and discover thousands of movies and TV shows on ZIVOX. Filter by genre, rating, year, and more.',
  },
};

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return <div className="w-full flex flex-col">{children}</div>;
}
