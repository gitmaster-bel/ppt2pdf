import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig({
  // Use Cloudflare's Cache API — replaces Vercel ISR/Data Cache
  // s-maxage headers in next.config.ts drive CDN caching globally
});
