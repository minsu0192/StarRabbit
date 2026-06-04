/**
 * Deprecated.
 *
 * This file used to insert manually curated Kakao rows, but that data was not
 * reliable enough for production. Keep this guard so nobody accidentally
 * re-seeds unverified platform data.
 */

console.error('scripts/seed-kakao.mjs is deprecated. Use verified source crawling or manual rows with source URLs.');
process.exit(1);
