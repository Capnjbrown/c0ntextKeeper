#!/usr/bin/env node

/**
 * Star history chart generator for c0ntextkeeper
 *
 * Replaces the third-party star-history.com embed, which stopped rendering when
 * GitHub restricted the stargazers API to repo admins and collaborators on
 * June 30, 2026. Reading that endpoint now requires a token with Contents:write,
 * which is push access - too broad to hand to a third party and embed in a
 * public README. This generates the chart in-repo instead.
 *
 * Subcommands:
 *   backfill  Rebuild the full series from the stargazers API. Needs GITHUB_TOKEN
 *             with Contents:write (or a classic token with repo/public_repo).
 *             Run locally, once. The token is read from the environment and is
 *             never written to disk.
 *   update    Append today's point using the public star count. Needs no auth at
 *             all - this is what CI runs on a schedule.
 *   render    Regenerate both SVG charts from the stored series.
 *
 * Data:   assets/star-history.json
 * Charts: assets/star-history-light.svg, assets/star-history-dark.svg
 */

const fs = require('fs');
const path = require('path');

const REPO = 'Capnjbrown/c0ntextKeeper';
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const DATA_FILE = path.join(ASSETS_DIR, 'star-history.json');

const WIDTH = 800;
const HEIGHT = 400;
const MARGIN = { top: 24, right: 28, bottom: 44, left: 60 };

const THEMES = {
  light: {
    file: 'star-history-light.svg',
    background: '#ffffff',
    grid: '#d0d7de',
    axis: '#57606a',
    text: '#57606a',
    line: '#8b5cf6',
    fillTop: 'rgba(139, 92, 246, 0.22)',
    fillBottom: 'rgba(139, 92, 246, 0.02)',
  },
  dark: {
    file: 'star-history-dark.svg',
    background: '#0d1117',
    grid: '#30363d',
    axis: '#8b949e',
    text: '#8b949e',
    line: '#a78bfa',
    fillTop: 'rgba(167, 139, 250, 0.26)',
    fillBottom: 'rgba(167, 139, 250, 0.02)',
  },
};

/**
 * Read the stored series, or an empty series if this is a first run.
 * @returns {{repo: string, points: Array<{date: string, count: number}>}}
 */
function readSeries() {
  if (!fs.existsSync(DATA_FILE)) {
    return { repo: REPO, points: [] };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

/**
 * Write the series, keeping one point per date and sorting chronologically.
 * @param {{repo: string, points: Array<{date: string, count: number}>}} series
 */
function writeSeries(series) {
  const byDate = new Map();
  for (const point of series.points) {
    byDate.set(point.date, point.count);
  }

  const points = Array.from(byDate, ([date, count]) => ({ date, count })).sort(
    (a, b) => a.date.localeCompare(b.date),
  );

  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  fs.writeFileSync(
    DATA_FILE,
    `${JSON.stringify({ repo: series.repo, points }, null, 2)}\n`,
  );

  return points;
}

/**
 * Rebuild the series from every stargazer's starred_at timestamp.
 * This is the only path that needs an authenticated token.
 */
async function backfill() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    console.error(
      'backfill needs GITHUB_TOKEN (or GH_TOKEN) in the environment.\n' +
        'Reading stargazers requires Contents:write since GitHub restricted the\n' +
        'endpoint on June 30, 2026. Run this locally, never in CI.',
    );
    process.exit(1);
  }

  const timestamps = [];

  for (let page = 1; ; page += 1) {
    const response = await fetch(
      `https://api.github.com/repos/${REPO}/stargazers?per_page=100&page=${page}`,
      {
        headers: {
          Accept: 'application/vnd.github.star+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );

    if (!response.ok) {
      console.error(
        `GitHub returned ${response.status} for stargazers page ${page}.\n` +
          'A 403 or 404 here usually means the token lacks Contents:write.',
      );
      process.exit(1);
    }

    const batch = await response.json();
    for (const entry of batch) {
      if (entry.starred_at) {
        timestamps.push(entry.starred_at.slice(0, 10));
      }
    }

    if (batch.length < 100) break;
  }

  timestamps.sort();

  // Convert individual star events into a cumulative running total.
  const points = timestamps.map((date, index) => ({ date, count: index + 1 }));

  const written = writeSeries({ repo: REPO, points });
  console.log(
    `Backfilled ${timestamps.length} stars into ${written.length} points.`,
  );
}

/**
 * Append today's star count using public repo metadata. No token required.
 */
async function update() {
  const response = await fetch(`https://api.github.com/repos/${REPO}`, {
    headers: { 'X-GitHub-Api-Version': '2022-11-28' },
  });

  if (!response.ok) {
    console.error(`GitHub returned ${response.status} for repo metadata.`);
    process.exit(1);
  }

  const { stargazers_count: count } = await response.json();
  const today = new Date().toISOString().slice(0, 10);

  const series = readSeries();
  const latest = series.points[series.points.length - 1];

  // Only record a point when the count actually moved. Appending on every run
  // would dirty the tree each time and commit noise on days with no new stars.
  if (latest && latest.count === count) {
    console.log(`Still ${count} stars; nothing to record.`);
    return;
  }

  series.points.push({ date: today, count });

  writeSeries(series);
  console.log(`Recorded ${count} stars for ${today}.`);
}

/**
 * Pick an axis step that lands on 1, 2, or 5 times a power of ten.
 * @param {number} range
 * @param {number} targetTicks
 */
function niceStep(range, targetTicks) {
  const rough = Math.max(range, 1) / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;

  if (normalized <= 1) return magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function escapeXml(value) {
  return String(value).replace(
    /[<>&"]/g,
    (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[char],
  );
}

/**
 * Render one themed SVG from the series.
 * @param {Array<{date: string, count: number}>} points
 * @param {typeof THEMES.light} theme
 */
function renderSvg(points, theme) {
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const times = points.map((p) => Date.parse(p.date));
  const minTime = times[0];
  const maxTime = times[times.length - 1];
  const timeSpan = Math.max(maxTime - minTime, 1);

  const maxCount = Math.max(...points.map((p) => p.count), 1);
  const yStep = niceStep(maxCount, 5);
  const yMax = Math.ceil(maxCount / yStep) * yStep;

  const toX = (time) => MARGIN.left + ((time - minTime) / timeSpan) * plotWidth;
  const toY = (count) => MARGIN.top + plotHeight - (count / yMax) * plotHeight;

  const coords = points.map((p, i) => [toX(times[i]), toY(p.count)]);
  const linePath = coords
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');

  const baseline = MARGIN.top + plotHeight;
  const areaPath = `${linePath} L${coords[coords.length - 1][0].toFixed(1)},${baseline} L${coords[0][0].toFixed(1)},${baseline} Z`;

  const yTicks = [];
  for (let value = 0; value <= yMax; value += yStep) {
    const y = toY(value);
    yTicks.push(
      `<line x1="${MARGIN.left}" y1="${y.toFixed(1)}" x2="${MARGIN.left + plotWidth}" y2="${y.toFixed(1)}" stroke="${theme.grid}" stroke-width="1" />`,
      `<text x="${MARGIN.left - 12}" y="${(y + 4).toFixed(1)}" fill="${theme.text}" font-size="12" text-anchor="end">${value}</text>`,
    );
  }

  const xTickCount = Math.min(5, points.length);
  const xTicks = [];
  for (let i = 0; i < xTickCount; i += 1) {
    const time =
      xTickCount === 1
        ? minTime
        : minTime + (timeSpan * i) / (xTickCount - 1);
    const x = toX(time);

    // Anchor the outer labels inward so they cannot overrun the viewBox.
    let anchor = 'middle';
    if (i === 0) anchor = 'start';
    else if (i === xTickCount - 1) anchor = 'end';

    xTicks.push(
      `<text x="${x.toFixed(1)}" y="${baseline + 24}" fill="${theme.text}" font-size="12" text-anchor="${anchor}">${escapeXml(formatDate(time))}</text>`,
    );
  }

  const last = points[points.length - 1];
  const gradientId = `star-fill-${theme.line.replace('#', '')}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="Star history for ${escapeXml(REPO)}: ${last.count} stars as of ${escapeXml(last.date)}">
  <defs>
    <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${theme.fillTop}" />
      <stop offset="100%" stop-color="${theme.fillBottom}" />
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${theme.background}" />
  <g font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif">
    ${yTicks.join('\n    ')}
    <path d="${areaPath}" fill="url(#${gradientId})" />
    <path d="${linePath}" fill="none" stroke="${theme.line}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
    <circle cx="${coords[coords.length - 1][0].toFixed(1)}" cy="${coords[coords.length - 1][1].toFixed(1)}" r="4" fill="${theme.line}" />
    <line x1="${MARGIN.left}" y1="${baseline}" x2="${MARGIN.left + plotWidth}" y2="${baseline}" stroke="${theme.axis}" stroke-width="1" />
    ${xTicks.join('\n    ')}
    <text x="${MARGIN.left}" y="${MARGIN.top - 8}" fill="${theme.text}" font-size="13" font-weight="600">${escapeXml(REPO)} - ${last.count} stars</text>
  </g>
</svg>
`;
}

/**
 * Write both themed charts from the stored series.
 */
function render() {
  const { points } = readSeries();

  if (points.length === 0) {
    console.error('No data in assets/star-history.json. Run backfill first.');
    process.exit(1);
  }

  for (const theme of Object.values(THEMES)) {
    const target = path.join(ASSETS_DIR, theme.file);
    fs.writeFileSync(target, renderSvg(points, theme));
    console.log(`Wrote ${path.relative(process.cwd(), target)}`);
  }
}

const COMMANDS = { backfill, update, render };

async function main() {
  const command = process.argv[2];

  if (!COMMANDS[command]) {
    console.error(`Usage: node scripts/star-history.js <backfill|update|render>`);
    process.exit(1);
  }

  await COMMANDS[command]();

  // update and backfill both change the data, so refresh the charts too.
  if (command !== 'render') {
    render();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
