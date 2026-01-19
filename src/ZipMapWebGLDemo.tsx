import { ZipMapWebGL } from './components/ZipMapWebGL';
import { sharedZipMapData } from './shared/zipMapData';

export function ZipMapWebGLDemo() {
  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 16 }}>WebGL Zip Code Map (High Performance)</h1>

      <ZipMapWebGL data={sharedZipMapData} width={1000} height={650} />

      <div
        style={{
          marginTop: 16,
          padding: 12,
          background: '#f5f5f5',
          borderRadius: 6,
          fontSize: 13,
          color: '#555',
        }}
      >
        <strong>Features:</strong> Automatic LOD switching • 3-digit consolidation at low zoom •
        5-digit detail at high zoom • WebGL rendering for maximum performance
      </div>

      {/* Data Validation Guide */}
      <div
        style={{
          marginTop: 24,
          padding: 20,
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: 8,
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>ZCTA Data Validation Guide</h2>

        <h3 style={{ margin: '16px 0 8px', fontSize: 15 }}>Current Data Source</h3>
        <p style={{ margin: '0 0 12px', color: '#555' }}>
          TopoJSON files are loaded from <code>/public/zcta/[STATE_FIPS].topojson</code>. These
          appear to be derived from US Census Bureau ZCTA (Zip Code Tabulation Area) shapefiles,
          converted to TopoJSON format. The object names suggest they came from a third-party source
          (e.g., "ny_new_york_zip_codes_geo.min").
        </p>

        <h3 style={{ margin: '16px 0 8px', fontSize: 15 }}>Why Holes May Appear</h3>
        <ul style={{ margin: '0 0 12px', paddingLeft: 20, color: '#555' }}>
          <li>
            <strong>ZCTA ≠ ZIP codes:</strong> ZCTAs are Census Bureau approximations of USPS ZIP
            codes. PO Box-only ZIPs, unique ZIPs (large businesses), and military ZIPs have no
            geographic area.
          </li>
          <li>
            <strong>Cross-state prefixes:</strong> Some 3-digit prefixes span multiple states. We
            only load states with data, so parts may be missing.
          </li>
          <li>
            <strong>Data mismatch:</strong> Your data ZIP codes may not exist in the ZCTA files.
          </li>
        </ul>

        <h3 style={{ margin: '16px 0 8px', fontSize: 15 }}>How to Validate Your Data</h3>
        <pre
          style={{
            background: '#f8f8f8',
            padding: 12,
            borderRadius: 4,
            overflow: 'auto',
            fontSize: 12,
          }}
        >
          {`// 1. Load the TopoJSON for a state
const response = await fetch('/zcta/06.topojson'); // California
const topo = await response.json();

// 2. Extract all valid ZCTA codes
const objName = 'zcta_simplified'; // varies by state, see zctaLoader.ts
const features = topojson.feature(topo, topo.objects[objName]).features;
const validZctas = new Set(features.map(f => f.properties.ZCTA5CE10));

// 3. Check your data against valid ZCTAs
const yourZips = ['94601', '94501', '99999'];
yourZips.forEach(zip => {
  if (!validZctas.has(zip)) {
    console.warn(\`ZIP \${zip} not found in ZCTA data\`);
  }
});`}
        </pre>

        <h3 style={{ margin: '16px 0 8px', fontSize: 15 }}>Recommended Data Sources</h3>
        <ul style={{ margin: '0 0 12px', paddingLeft: 20, color: '#555' }}>
          <li>
            <strong>US Census Bureau (Official):</strong>{' '}
            <a
              href="https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html"
              target="_blank"
              rel="noopener"
            >
              Cartographic Boundary Files
            </a>{' '}
            - Download ZCTA shapefiles, convert to TopoJSON with <code>geo2topo</code> /{' '}
            <code>topojson-simplify</code>
          </li>
          <li>
            <strong>Census TIGER/Line:</strong>{' '}
            <a
              href="https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html"
              target="_blank"
              rel="noopener"
            >
              TIGER/Line Shapefiles
            </a>{' '}
            - More detailed but larger files
          </li>
          <li>
            <strong>OpenDataSoft:</strong>{' '}
            <a
              href="https://public.opendatasoft.com/explore/dataset/us-zip-code-latitude-and-longitude/"
              target="_blank"
              rel="noopener"
            >
              US ZIP Code Dataset
            </a>{' '}
            - Pre-processed, includes lat/lon centroids
          </li>
        </ul>

        <h3 style={{ margin: '16px 0 8px', fontSize: 15 }}>Updating TopoJSON Files</h3>
        <p style={{ margin: '0 0 8px', color: '#555' }}>To update the ZCTA data (e.g., from S3):</p>
        <ol style={{ margin: '0 0 12px', paddingLeft: 20, color: '#555' }}>
          <li>
            Update <code>zctaLoader.ts</code> to fetch from your S3 bucket URL instead of{' '}
            <code>/zcta/</code>
          </li>
          <li>
            Ensure TopoJSON files have consistent object names (update{' '}
            <code>STATE_OBJECT_NAMES</code> mapping if needed)
          </li>
          <li>
            Each file should have features with <code>properties.ZCTA5CE10</code> containing the
            5-digit ZCTA code
          </li>
        </ol>

        <pre
          style={{
            background: '#f8f8f8',
            padding: 12,
            borderRadius: 4,
            overflow: 'auto',
            fontSize: 12,
          }}
        >
          {`// zctaLoader.ts - Change this line to use S3:
const url = \`/zcta/\${stateFips}.topojson\`;
// To:
const url = \`https://your-bucket.s3.amazonaws.com/zcta/\${stateFips}.topojson\`;`}
        </pre>
      </div>
    </div>
  );
}
