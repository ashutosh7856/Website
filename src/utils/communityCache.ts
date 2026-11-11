// Cache utility for community feed
const feedCache = new Map<string, { data: unknown[], nextPageToken: string | null, timestamp: number }>();

export function getCommunityFeedCache(key: string) {
  return feedCache.get(key);
}

export function setCommunityFeedCache(key: string, data: unknown[], nextPageToken: string | null) {
  feedCache.set(key, {
    data,
    nextPageToken,
    timestamp: Date.now(),
  });
}

export function clearCommunityFeedCache(userId?: string) {
  if (userId) {
    feedCache.delete(`community-feed-${userId}`);
  } else {
    feedCache.clear();
  }
}

export function isCommunityFeedCacheValid(key: string, duration: number = 5 * 60 * 1000): boolean {
  const cached = feedCache.get(key);
  if (!cached) return false;
  
  const now = Date.now();
  return (now - cached.timestamp) < duration;
}

export { feedCache };
