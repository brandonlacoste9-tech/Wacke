import HomePageClient from "@/components/HomePageClient";
import { fetchAllStreams, fetchPlatformStats } from "@/lib/stream-aggregator";

export const revalidate = 30;

export default async function HomePage() {
  const [streams, stats] = await Promise.all([
    fetchAllStreams(20),
    fetchPlatformStats(),
  ]);

  return <HomePageClient initialStreams={streams} initialStats={stats} />;
}