#!/usr/bin/env node

/**
 * ZCTA TopoJSON Setup Script
 *
 * This script checks for required ZCTA TopoJSON files and provides
 * instructions for obtaining them.
 *
 * Usage: npm run download:zcta
 *
 * For S3 deployment: Set ZCTA_BASE_URL environment variable
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'public', 'zcta');

// State FIPS codes
const STATE_FIPS = [
  '01',
  '02',
  '04',
  '05',
  '06',
  '08',
  '09',
  '10',
  '11',
  '12',
  '13',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
  '30',
  '31',
  '32',
  '33',
  '34',
  '35',
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '44',
  '45',
  '46',
  '47',
  '48',
  '49',
  '50',
  '51',
  '53',
  '54',
  '55',
  '56',
];

const FIPS_TO_NAME = {
  '01': 'Alabama',
  '02': 'Alaska',
  '04': 'Arizona',
  '05': 'Arkansas',
  '06': 'California',
  '08': 'Colorado',
  '09': 'Connecticut',
  10: 'Delaware',
  11: 'DC',
  12: 'Florida',
  13: 'Georgia',
  15: 'Hawaii',
  16: 'Idaho',
  17: 'Illinois',
  18: 'Indiana',
  19: 'Iowa',
  20: 'Kansas',
  21: 'Kentucky',
  22: 'Louisiana',
  23: 'Maine',
  24: 'Maryland',
  25: 'Massachusetts',
  26: 'Michigan',
  27: 'Minnesota',
  28: 'Mississippi',
  29: 'Missouri',
  30: 'Montana',
  31: 'Nebraska',
  32: 'Nevada',
  33: 'New Hampshire',
  34: 'New Jersey',
  35: 'New Mexico',
  36: 'New York',
  37: 'North Carolina',
  38: 'North Dakota',
  39: 'Ohio',
  40: 'Oklahoma',
  41: 'Oregon',
  42: 'Pennsylvania',
  44: 'Rhode Island',
  45: 'South Carolina',
  46: 'South Dakota',
  47: 'Tennessee',
  48: 'Texas',
  49: 'Utah',
  50: 'Vermont',
  51: 'Virginia',
  53: 'Washington',
  54: 'West Virginia',
  55: 'Wisconsin',
  56: 'Wyoming',
};

function download(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return download(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

async function main() {
  console.log('ZCTA TopoJSON Setup\n');
  console.log('='.repeat(50));

  // Check if directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}\n`);
  }

  // Check which files exist
  const existing = [];
  const missing = [];

  for (const fips of STATE_FIPS) {
    const filePath = path.join(OUTPUT_DIR, `${fips}.topojson`);
    if (fs.existsSync(filePath)) {
      existing.push(fips);
    } else {
      missing.push(fips);
    }
  }

  console.log(`\nFound: ${existing.length}/${STATE_FIPS.length} files`);

  if (missing.length > 0) {
    console.log(`\nMissing files for: ${missing.map((f) => FIPS_TO_NAME[f]).join(', ')}`);

    // Try to download from S3 if URL is set
    const baseUrl = process.env.ZCTA_BASE_URL;
    if (baseUrl) {
      console.log(`\nDownloading from: ${baseUrl}`);
      for (const fips of missing) {
        const url = `${baseUrl}${fips}.topojson`;
        const filePath = path.join(OUTPUT_DIR, `${fips}.topojson`);
        try {
          process.stdout.write(`  Downloading ${fips} (${FIPS_TO_NAME[fips]})...`);
          const data = await download(url);
          fs.writeFileSync(filePath, data);
          console.log(' ✓');
        } catch (err) {
          console.log(` ✗ (${err.message})`);
        }
      }
    } else {
      console.log('\n' + '='.repeat(50));
      console.log('HOW TO OBTAIN ZCTA FILES:');
      console.log('='.repeat(50));
      console.log(`
1. FROM S3 (recommended for team use):
   Set ZCTA_BASE_URL and re-run:
   
   ZCTA_BASE_URL=https://your-bucket.s3.amazonaws.com/zcta/ npm run download:zcta

2. FROM US CENSUS BUREAU:
   - Download ZCTA shapefiles from:
     https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html
   - Convert to TopoJSON using:
     npx geo2topo zcta.shp -o zcta.topojson
     npx topojson-simplify zcta.topojson -o zcta-simplified.topojson

3. MANUAL COPY:
   Copy TopoJSON files to: ${OUTPUT_DIR}
   Files should be named: [FIPS].topojson (e.g., 06.topojson for California)
   
   Each file must have:
   - type: "Topology"
   - objects with geometries containing properties.ZCTA5CE10 (5-digit ZCTA code)
`);
    }
  } else {
    console.log('\n✓ All ZCTA files present!');
  }
}

main().catch(console.error);
