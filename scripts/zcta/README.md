# ZCTA (Zip Code Tabulation Area) Data Scripts

This directory contains scripts for managing ZCTA TopoJSON files used by the zip code map components.

## Directory Structure

```
scripts/zcta/
├── README.md           # This file
├── download-zcta.cjs   # Check/download ZCTA files
└── convert-zcta.sh     # Convert GeoJSON to TopoJSON and upload to S3

public/zcta/            # TopoJSON files (gitignored)
└── [FIPS].topojson     # e.g., 06.topojson for California
```

## Scripts

### download-zcta.cjs

Checks for required ZCTA files and downloads them if a source URL is provided.

```bash
# Check which files exist
npm run download:zcta

# Download from S3
ZCTA_BASE_URL=https://your-bucket.s3.amazonaws.com/zcta/ npm run download:zcta
```

### convert-zcta.sh

Converts GeoJSON files from [OpenDataDE](https://github.com/OpenDataDE/State-zip-code-GeoJSON) to TopoJSON and uploads to S3.

Requirements:

- `mapshaper` CLI (`npm install -g mapshaper`)
- AWS CLI configured with appropriate credentials

```bash
cd scripts/zcta
./convert-zcta.sh
```

## Data Sources

1. **OpenDataDE** (current): https://github.com/OpenDataDE/State-zip-code-GeoJSON
   - Pre-processed state-level GeoJSON files
   - Derived from US Census ZCTA data

2. **US Census Bureau** (official): https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html
   - Official ZCTA shapefiles
   - Updated annually

## File Format

Each TopoJSON file must have:

- `type: "Topology"`
- An object containing geometries with `properties.ZCTA5CE10` (5-digit ZCTA code)

The object name varies by state (see `src/components/ZipMap/zctaLoader.ts` for mapping).

## Updating for Production

To switch to S3-hosted files, update `src/components/ZipMap/zctaLoader.ts`:

```typescript
// Change:
const url = `/zcta/${stateFips}.topojson`;

// To:
const url = `https://your-bucket.s3.amazonaws.com/zcta/${stateFips}.topojson`;
```
