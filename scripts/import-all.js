/**
 * IMPORT ALL 50 WORDPRESS SITES INTO RAILWAY POSTGRESQL
 *
 * Usage:
 *   1. Install: npm install pg
 *   2. Run: node scripts/import-all.js
 *
 *   Set DATABASE_URL environment variable before running:
 *   DATABASE_URL=postgresql://user:pass@host:5432/railway node scripts/import-all.js
 */

const { Pool } = require("pg");

// === YOUR RAILWAY DATABASE URL ===
const DATABASE_URL = process.env.DATABASE_URL || "YOUR_RAILWAY_DATABASE_URL_HERE";

const pool = new Pool({ connectionString: DATABASE_URL });

// === ALL 50 SITES ===
const SITES = [
  { slug: "alabama-express", domain: "alabama-express.com", name: "Alabama Express", logoFirst: "ALABAMA", logoSecond: "EXPRESS", city: "Birmingham", state: "Alabama", stateAbbr: "AL", tagline: "Alabama's Breaking News Source" },
  { slug: "alaska-express", domain: "alaskaexpres.com", name: "Alaska Express", logoFirst: "ALASKA", logoSecond: "EXPRESS", city: "Anchorage", state: "Alaska", stateAbbr: "AK", tagline: "Alaska's Breaking News Source" },
  { slug: "arizona-express", domain: "arizona-express.com", name: "Arizona Express", logoFirst: "ARIZONA", logoSecond: "EXPRESS", city: "Phoenix", state: "Arizona", stateAbbr: "AZ", tagline: "Arizona's Breaking News Source" },
  { slug: "arkansas-express", domain: "arkansas-express.com", name: "Arkansas Express", logoFirst: "ARKANSAS", logoSecond: "EXPRESS", city: "Little Rock", state: "Arkansas", stateAbbr: "AR", tagline: "Arkansas's Breaking News Source" },
  { slug: "california-express", domain: "californiaexpres.com", name: "California Express", logoFirst: "CALIFORNIA", logoSecond: "EXPRESS", city: "Los Angeles", state: "California", stateAbbr: "CA", tagline: "California's Breaking News Source" },
  { slug: "colorado-express", domain: "coloradoexpres.com", name: "Colorado Express", logoFirst: "COLORADO", logoSecond: "EXPRESS", city: "Denver", state: "Colorado", stateAbbr: "CO", tagline: "Colorado's Breaking News Source" },
  { slug: "connecticut-express", domain: "connecticut-express.com", name: "Connecticut Express", logoFirst: "CONNECTICUT", logoSecond: "EXPRESS", city: "Hartford", state: "Connecticut", stateAbbr: "CT", tagline: "Connecticut's Breaking News Source" },
  { slug: "delaware-express", domain: "delaware-express.com", name: "Delaware Express", logoFirst: "DELAWARE", logoSecond: "EXPRESS", city: "Wilmington", state: "Delaware", stateAbbr: "DE", tagline: "Delaware's Breaking News Source" },
  { slug: "florida-express", domain: "florida-expres.com", name: "Florida Express", logoFirst: "FLORIDA", logoSecond: "EXPRESS", city: "Miami", state: "Florida", stateAbbr: "FL", tagline: "Florida's Breaking News Source" },
  { slug: "georgia-express", domain: "georgia-express.com", name: "Georgia Express", logoFirst: "GEORGIA", logoSecond: "EXPRESS", city: "Atlanta", state: "Georgia", stateAbbr: "GA", tagline: "Georgia's Breaking News Source" },
  { slug: "hawaii-express", domain: "hawaiiexpres.com", name: "Hawaii Express", logoFirst: "HAWAII", logoSecond: "EXPRESS", city: "Honolulu", state: "Hawaii", stateAbbr: "HI", tagline: "Hawaii's Breaking News Source" },
  { slug: "idaho-express", domain: "idaho-express.com", name: "Idaho Express", logoFirst: "IDAHO", logoSecond: "EXPRESS", city: "Boise", state: "Idaho", stateAbbr: "ID", tagline: "Idaho's Breaking News Source" },
  { slug: "illinois-express", domain: "illinoiseexpres.com", name: "Illinois Express", logoFirst: "ILLINOIS", logoSecond: "EXPRESS", city: "Chicago", state: "Illinois", stateAbbr: "IL", tagline: "Illinois's Breaking News Source" },
  { slug: "indiana-express", domain: "indianaexpres.com", name: "Indiana Express", logoFirst: "INDIANA", logoSecond: "EXPRESS", city: "Indianapolis", state: "Indiana", stateAbbr: "IN", tagline: "Indiana's Breaking News Source" },
  { slug: "iowa-express", domain: "iowa-express.com", name: "Iowa Express", logoFirst: "IOWA", logoSecond: "EXPRESS", city: "Des Moines", state: "Iowa", stateAbbr: "IA", tagline: "Iowa's Breaking News Source" },
  { slug: "kansas-express", domain: "kansas-express.com", name: "Kansas Express", logoFirst: "KANSAS", logoSecond: "EXPRESS", city: "Wichita", state: "Kansas", stateAbbr: "KS", tagline: "Kansas's Breaking News Source" },
  { slug: "kentucky-express", domain: "kentucky-express.com", name: "Kentucky Express", logoFirst: "KENTUCKY", logoSecond: "EXPRESS", city: "Louisville", state: "Kentucky", stateAbbr: "KY", tagline: "Kentucky's Breaking News Source" },
  { slug: "louisiana-express", domain: "louisiana-express.com", name: "Louisiana Express", logoFirst: "LOUISIANA", logoSecond: "EXPRESS", city: "New Orleans", state: "Louisiana", stateAbbr: "LA", tagline: "Louisiana's Breaking News Source" },
  { slug: "maine-express", domain: "maineeexpres.com", name: "Maine Express", logoFirst: "MAINE", logoSecond: "EXPRESS", city: "Portland", state: "Maine", stateAbbr: "ME", tagline: "Maine's Breaking News Source" },
  { slug: "maryland-express", domain: "maryland-express.com", name: "Maryland Express", logoFirst: "MARYLAND", logoSecond: "EXPRESS", city: "Baltimore", state: "Maryland", stateAbbr: "MD", tagline: "Maryland's Breaking News Source" },
  { slug: "massachusetts-express", domain: "massachusettsexpress.com", name: "Massachusetts Express", logoFirst: "MASSACHUSETTS", logoSecond: "EXPRESS", city: "Boston", state: "Massachusetts", stateAbbr: "MA", tagline: "Massachusetts's Breaking News Source" },
  { slug: "michigan-express", domain: "michigan-express.com", name: "Michigan Express", logoFirst: "MICHIGAN", logoSecond: "EXPRESS", city: "Detroit", state: "Michigan", stateAbbr: "MI", tagline: "Michigan's Breaking News Source" },
  { slug: "minnesota-express", domain: "minnesota-express.com", name: "Minnesota Express", logoFirst: "MINNESOTA", logoSecond: "EXPRESS", city: "Minneapolis", state: "Minnesota", stateAbbr: "MN", tagline: "Minnesota's Breaking News Source" },
  { slug: "mississippi-express", domain: "mississippi-express.com", name: "Mississippi Express", logoFirst: "MISSISSIPPI", logoSecond: "EXPRESS", city: "Jackson", state: "Mississippi", stateAbbr: "MS", tagline: "Mississippi's Breaking News Source" },
  { slug: "missouri-express", domain: "missouri-express.com", name: "Missouri Express", logoFirst: "MISSOURI", logoSecond: "EXPRESS", city: "Kansas City", state: "Missouri", stateAbbr: "MO", tagline: "Missouri's Breaking News Source" },
  { slug: "montana-express", domain: "montana-express.com", name: "Montana Express", logoFirst: "MONTANA", logoSecond: "EXPRESS", city: "Billings", state: "Montana", stateAbbr: "MT", tagline: "Montana's Breaking News Source" },
  { slug: "nebraska-express", domain: "nebraska-express.com", name: "Nebraska Express", logoFirst: "NEBRASKA", logoSecond: "EXPRESS", city: "Omaha", state: "Nebraska", stateAbbr: "NE", tagline: "Nebraska's Breaking News Source" },
  { slug: "nevada-express", domain: "nevada-express.com", name: "Nevada Express", logoFirst: "NEVADA", logoSecond: "EXPRESS", city: "Las Vegas", state: "Nevada", stateAbbr: "NV", tagline: "Nevada's Breaking News Source" },
  { slug: "newhampshire-express", domain: "newhampshire-express.com", name: "New Hampshire Express", logoFirst: "NEW HAMPSHIRE", logoSecond: "EXPRESS", city: "Manchester", state: "New Hampshire", stateAbbr: "NH", tagline: "New Hampshire's Breaking News Source" },
  { slug: "newjersey-express", domain: "newjersey-express.com", name: "New Jersey Express", logoFirst: "NEW JERSEY", logoSecond: "EXPRESS", city: "Newark", state: "New Jersey", stateAbbr: "NJ", tagline: "New Jersey's Breaking News Source" },
  { slug: "newmexico-express", domain: "newmexico-express.com", name: "New Mexico Express", logoFirst: "NEW MEXICO", logoSecond: "EXPRESS", city: "Albuquerque", state: "New Mexico", stateAbbr: "NM", tagline: "New Mexico's Breaking News Source" },
  { slug: "newyork-express", domain: "newyork-express.com", name: "New York Express", logoFirst: "NEW YORK", logoSecond: "EXPRESS", city: "New York City", state: "New York", stateAbbr: "NY", tagline: "New York's Breaking News Source" },
  { slug: "northcarolina-express", domain: "northcarolinasexpress.com", name: "North Carolina Express", logoFirst: "NORTH CAROLINA", logoSecond: "EXPRESS", city: "Charlotte", state: "North Carolina", stateAbbr: "NC", tagline: "North Carolina's Breaking News Source" },
  { slug: "northdakota-express", domain: "northdakota-express.com", name: "North Dakota Express", logoFirst: "NORTH DAKOTA", logoSecond: "EXPRESS", city: "Fargo", state: "North Dakota", stateAbbr: "ND", tagline: "North Dakota's Breaking News Source" },
  { slug: "ohio-express", domain: "ohioexpres.com", name: "Ohio Express", logoFirst: "OHIO", logoSecond: "EXPRESS", city: "Columbus", state: "Ohio", stateAbbr: "OH", tagline: "Ohio's Breaking News Source" },
  { slug: "oklahoma-express", domain: "oklahoma-express.com", name: "Oklahoma Express", logoFirst: "OKLAHOMA", logoSecond: "EXPRESS", city: "Oklahoma City", state: "Oklahoma", stateAbbr: "OK", tagline: "Oklahoma's Breaking News Source" },
  { slug: "oregon-express", domain: "oregon-express.com", name: "Oregon Express", logoFirst: "OREGON", logoSecond: "EXPRESS", city: "Portland", state: "Oregon", stateAbbr: "OR", tagline: "Oregon's Breaking News Source" },
  { slug: "pennsylvania-express", domain: "pennsylvaniaexpres.com", name: "Pennsylvania Express", logoFirst: "PENNSYLVANIA", logoSecond: "EXPRESS", city: "Philadelphia", state: "Pennsylvania", stateAbbr: "PA", tagline: "Pennsylvania's Breaking News Source" },
  { slug: "rhodeisland-express", domain: "rhodeisland-express.com", name: "Rhode Island Express", logoFirst: "RHODE ISLAND", logoSecond: "EXPRESS", city: "Providence", state: "Rhode Island", stateAbbr: "RI", tagline: "Rhode Island's Breaking News Source" },
  { slug: "southcarolina-express", domain: "southcarolina-express.com", name: "South Carolina Express", logoFirst: "SOUTH CAROLINA", logoSecond: "EXPRESS", city: "Charleston", state: "South Carolina", stateAbbr: "SC", tagline: "South Carolina's Breaking News Source" },
  { slug: "southdakota-express", domain: "southdakota-express.com", name: "South Dakota Express", logoFirst: "SOUTH DAKOTA", logoSecond: "EXPRESS", city: "Sioux Falls", state: "South Dakota", stateAbbr: "SD", tagline: "South Dakota's Breaking News Source" },
  { slug: "tennessee-express", domain: "tennesseeexpres.com", name: "Tennessee Express", logoFirst: "TENNESSEE", logoSecond: "EXPRESS", city: "Nashville", state: "Tennessee", stateAbbr: "TN", tagline: "Tennessee's Breaking News Source" },
  { slug: "texas-express", domain: "texasexpres.com", name: "Texas Express", logoFirst: "TEXAS", logoSecond: "EXPRESS", city: "Houston", state: "Texas", stateAbbr: "TX", tagline: "Texas's Breaking News Source" },
  { slug: "utah-express", domain: "utah-express.com", name: "Utah Express", logoFirst: "UTAH", logoSecond: "EXPRESS", city: "Salt Lake City", state: "Utah", stateAbbr: "UT", tagline: "Utah's Breaking News Source" },
  { slug: "vermont-express", domain: "vermont-express.com", name: "Vermont Express", logoFirst: "VERMONT", logoSecond: "EXPRESS", city: "Burlington", state: "Vermont", stateAbbr: "VT", tagline: "Vermont's Breaking News Source" },
  { slug: "virginia-express", domain: "virginiaexpres.com", name: "Virginia Express", logoFirst: "VIRGINIA", logoSecond: "EXPRESS", city: "Virginia Beach", state: "Virginia", stateAbbr: "VA", tagline: "Virginia's Breaking News Source" },
  { slug: "washington-express", domain: "washingtonexpres.com", name: "Washington Express", logoFirst: "WASHINGTON", logoSecond: "EXPRESS", city: "Seattle", state: "Washington", stateAbbr: "WA", tagline: "Washington's Breaking News Source" },
  { slug: "westvirginia-express", domain: "westvirginia-express.com", name: "West Virginia Express", logoFirst: "WEST VIRGINIA", logoSecond: "EXPRESS", city: "Charleston", state: "West Virginia", stateAbbr: "WV", tagline: "West Virginia's Breaking News Source" },
  { slug: "wisconsin-express", domain: "wisconsin-express.com", name: "Wisconsin Express", logoFirst: "WISCONSIN", logoSecond: "EXPRESS", city: "Milwaukee", state: "Wisconsin", stateAbbr: "WI", tagline: "Wisconsin's Breaking News Source" },
  { slug: "wyoming-express", domain: "wyoming-express.com", name: "Wyoming Express", logoFirst: "WYOMING", logoSecond: "EXPRESS", city: "Cheyenne", state: "Wyoming", stateAbbr: "WY", tagline: "Wyoming's Breaking News Source" },
];

async function fetchJSON(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return null;
  return { data: await res.json(), totalPages: parseInt(res.headers.get("x-wp-totalpages") || "1") };
}

function stripHtml(html) {
  return (html || "").replace(/<[^>]*>/g, "").trim();
}

async function importSite(site) {
  console.log(`\n━━━ ${site.name} (${site.domain}) ━━━`);

  // Create site in DB
  let siteId;
  const { rows: existing } = await pool.query("SELECT id FROM sites WHERE slug = $1", [site.slug]);
  if (existing.length > 0) {
    siteId = existing[0].id;
    console.log(`  Site exists (id: ${siteId})`);
  } else {
    const { rows: inserted } = await pool.query(
      `INSERT INTO sites (slug, domain, name, logo_first, logo_second, city, state, state_abbr, tagline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [site.slug, site.domain, site.name, site.logoFirst, site.logoSecond, site.city, site.state, site.stateAbbr, site.tagline]
    );
    siteId = inserted[0].id;
    console.log(`  Site created (id: ${siteId})`);
  }

  // Import articles page by page
  let imported = 0, skipped = 0, page = 1;

  while (true) {
    const url = `https://www.${site.domain}/wp-json/wp/v2/posts?per_page=100&page=${page}&_embed=author,wp:featuredmedia,wp:term`;

    let result;
    // Retry up to 3 times
    for (let retry = 0; retry < 3; retry++) {
      result = await fetchJSON(url).catch(() => null);
      if (result) break;
      // Also try without www
      result = await fetchJSON(url.replace("www.", "")).catch(() => null);
      if (result) break;
      console.log(`  Retry ${retry + 1}...`);
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!result || !Array.isArray(result.data) || result.data.length === 0) {
      if (page === 1) console.log(`  ❌ Could not access WordPress API`);
      break;
    }

    for (const post of result.data) {
      const title = stripHtml(post.title?.rendered || "");
      if (!title) { skipped++; continue; }

      const slug = post.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const content = post.content?.rendered || "";
      const summary = stripHtml(post.excerpt?.rendered || "");
      const author = post._embedded?.author?.[0]?.name || "Staff Reporter";
      const featuredImage = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "";
      const category = post._embedded?.["wp:term"]?.[0]?.[0]?.slug || "general";
      const pubDate = post.date || new Date().toISOString();

      try {
        const { rowCount } = await pool.query(
          `INSERT INTO articles (site_id, title, slug, content, summary, category, author, featured_image, published_at, wp_original_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (site_id, slug) DO NOTHING`,
          [siteId, title, slug, content, summary, category, author, featuredImage, pubDate, post.id]
        );
        if ((rowCount ?? 0) > 0) imported++;
        else skipped++;
      } catch { skipped++; }
    }

    process.stdout.write(`  Page ${page}/${result.totalPages} — ${imported} imported, ${skipped} skipped\r`);

    if (page >= result.totalPages) break;
    page++;

    // Don't hammer the server
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`  ✅ Done: ${imported} imported, ${skipped} skipped`);
  return { site: site.name, imported, skipped };
}

async function main() {
  console.log("🚀 Starting import of 50 WordPress sites...\n");
  console.log(`Database: ${DATABASE_URL.replace(/:[^@]+@/, ":***@")}\n`);

  const results = [];

  for (const site of SITES) {
    try {
      const result = await importSite(site);
      results.push(result);
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
      results.push({ site: site.name, imported: 0, skipped: 0 });
    }
  }

  // Summary
  console.log("\n\n════════════════════════════════════");
  console.log("        IMPORT COMPLETE");
  console.log("════════════════════════════════════\n");

  let totalImported = 0, totalSkipped = 0;
  for (const r of results) {
    console.log(`  ${r.imported > 0 ? "✅" : "❌"} ${r.site}: ${r.imported} imported, ${r.skipped} skipped`);
    totalImported += r.imported;
    totalSkipped += r.skipped;
  }
  console.log(`\n  TOTAL: ${totalImported} imported, ${totalSkipped} skipped\n`);

  await pool.end();
}

main().catch(console.error);
