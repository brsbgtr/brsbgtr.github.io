// Play Store'dan oyun istatistiklerini çekip stats.json dosyasına yazar.
// GitHub Actions her gün çalıştırır (.github/workflows/update-stats.yml).
import gplay from 'google-play-scraper';
import { readFile, writeFile } from 'node:fs/promises';

const GAMES = {
  traffic: 'com.zenitragames.trafficking',
  rocket: 'com.zenitragames.rocketsurge',
  arrows: 'com.ZenitraGames.ArrowsPuzzleMaze',
};
const FILE = 'stats.json';

let prev = { games: {} };
try { prev = JSON.parse(await readFile(FILE, 'utf8')); } catch {}

const out = { updated: prev.updated || null, games: { ...prev.games } };
let ok = 0;
for (const [id, appId] of Object.entries(GAMES)) {
  try {
    const a = await gplay.app({ appId, lang: 'en', country: 'tr' });
    out.games[id] = {
      downloads: a.installs || prev.games[id]?.downloads || '',
      minInstalls: a.minInstalls ?? null,
      rating: a.ratings > 0 && a.score ? a.score.toFixed(1) : '',
      ratings: a.ratings ?? 0,
      icon: a.icon || prev.games[id]?.icon || '',
      shots: (a.screenshots && a.screenshots.length ? a.screenshots : prev.games[id]?.shots || []).slice(0, 8),
      version: a.version || '',
      storeUpdated: a.updated || null,
    };
    ok++;
    console.log(`✓ ${id}: ${out.games[id].downloads} downloads, rating ${out.games[id].rating || '-'} (${out.games[id].ratings})`);
  } catch (e) {
    console.warn(`✗ ${id}: ${e.message} — keeping previous values`);
  }
}
if (ok) out.updated = new Date().toISOString();

// Sadece gerçekten bir şey değiştiyse yaz (gereksiz commit olmasın)
const strip = o => JSON.stringify({ ...o, updated: null });
if (strip(out) !== strip(prev)) {
  await writeFile(FILE, JSON.stringify(out, null, 2) + '\n');
  console.log('stats.json updated');
} else console.log('No changes');
if (!ok) process.exitCode = 1;
