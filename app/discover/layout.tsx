export const metadata = {
  title: 'Discover',
  robots: { index: false, follow: false },
};

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return <div className="w-full flex flex-col">{children}</div>;
}
