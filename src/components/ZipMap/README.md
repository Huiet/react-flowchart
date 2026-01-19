# US Zip Code Map - Fresh Implementation

A minimal, clean implementation of a US zip code heat map with tooltips and legend.

## Features

- **SVG-based rendering** using D3.js + React hooks pattern
- **Color-coded zip codes** based on account values
- **Interactive tooltips** showing zip code and accounts on hover
- **Legend** displaying color scale with thresholds
- **State toggles** to show/hide CA, NY, TX data
- **Reuses existing infrastructure** (zctaLoader.ts, /public/zcta/ TopoJSON files)

## Structure

```
src/components/ZipMap/
├── types.ts          # TypeScript interfaces
├── ZipMap.tsx        # Main map component
├── Tooltip.tsx       # Hover tooltip
├── Legend.tsx        # Color scale legend
├── colorScale.ts     # D3 color scale utility
└── index.ts          # Exports

src/ZipMapDemo.tsx    # Demo page with toggles
```

## Usage

Navigate to "US Zip Code Map" in the navigation menu, or visit `/zip-map-demo`.

Toggle California, New York, and Texas checkboxes to show/hide their zip code data.
Hover over colored zip codes to see tooltip with zip code and account count.

## Technical Details

- **Base map**: US states from cdn.jsdelivr.net/npm/us-atlas
- **Zip codes**: TopoJSON files from /public/zcta/ (FIPS-based)
- **Projection**: d3.geoAlbersUsa() for ZCTA features
- **Color scale**: d3.scaleQuantize() with 8-color blue scheme
- **Data format**: { zipCode: string, accounts: number }

## Mock Data

- CA: 8 zip codes (90001, 90210, 94102, 94110, 92101, 91101, 93101, 95101)
- NY: 8 zip codes (10001, 10011, 11201, 11215, 10003, 10012, 11211, 10002)
- TX: 8 zip codes (75201, 77001, 78701, 75001, 77002, 78201, 75019, 77019)
- Accounts: Random values between 500-10,500
