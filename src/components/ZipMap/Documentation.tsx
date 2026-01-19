import { Anchor, Code, Divider, List, Paper, Stack, Text, Title } from '@mantine/core';

export function ZipMapDocumentation() {
  return (
    <Paper p="xl" mt="xl" withBorder>
      <Stack gap="lg">
        <Title order={2}>ZipMap Component Documentation</Title>

        <Divider label="Architecture Overview" labelPosition="left" />

        <Stack gap="sm">
          <Title order={4}>Data Flow</Title>
          <Text size="sm">
            The ZipMap component renders a choropleth map of US zip codes with values. Data flows
            through several layers:
          </Text>
          <List size="sm" spacing="xs">
            <List.Item>
              <strong>Input Data:</strong> Array of{' '}
              <Code>{`{ zipCode: string, value: number }`}</Code> objects
            </List.Item>
            <List.Item>
              <strong>State Detection:</strong> Zip codes are mapped to state FIPS codes using
              prefix lookup
            </List.Item>
            <List.Item>
              <strong>ZCTA Loading:</strong> TopoJSON files are fetched only for states with data
            </List.Item>
            <List.Item>
              <strong>Rendering:</strong> D3.js renders SVG paths with color scale based on values
            </List.Item>
          </List>
        </Stack>

        <Divider label="Geographic Data Sources" labelPosition="left" />

        <Stack gap="sm">
          <Title order={4}>US States Base Map</Title>
          <Text size="sm">State boundaries are loaded from the US Atlas TopoJSON CDN:</Text>
          <Code block>{`https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json`}</Code>
          <Text size="sm" c="dimmed">
            This is an unprojected TopoJSON file (~900KB) containing all US state boundaries.
          </Text>
        </Stack>

        <Stack gap="sm">
          <Title order={4}>ZCTA (Zip Code) Data</Title>
          <Text size="sm">
            Zip code boundaries are stored as TopoJSON files in S3, sourced from{' '}
            <Anchor href="https://github.com/OpenDataDE/State-zip-code-GeoJSON" target="_blank">
              OpenDataDE/State-zip-code-GeoJSON
            </Anchor>{' '}
            and converted using mapshaper with 10% simplification.
          </Text>
          <Code block>
            {`S3 Bucket: state-zipcode-geo-data
Region: us-east-1
Path: /zcta/{fips}.topojson

Examples:
  /zcta/06.topojson  → California (~2.2MB)
  /zcta/36.topojson  → New York (~1.1MB)
  /zcta/48.topojson  → Texas (~2.4MB)

Total: 51 files (50 states + DC), ~36MB combined
Property for zip code: ZCTA5CE10`}
          </Code>
          <Text size="sm">
            For local development, files are synced to <Code>/public/zcta/</Code> since the S3
            bucket isn't publicly accessible due to account restrictions. The component fetches from{' '}
            <Code>/zcta/{'{fips}'}.topojson</Code>.
          </Text>
        </Stack>

        <Stack gap="sm">
          <Title order={4}>TopoJSON Structure</Title>
          <Text size="sm">
            Each state file contains a GeometryCollection with zip code polygons:
          </Text>
          <Code block>
            {`{
  "type": "Topology",
  "objects": {
    "{state}_zip_codes_geo.min": {
      "type": "GeometryCollection",
      "geometries": [{
        "type": "Polygon",
        "properties": {
          "ZCTA5CE10": "90210",  // Zip code
          "STATEFP10": "06",      // State FIPS
          ...
        }
      }]
    }
  }
}`}
          </Code>
          <Text size="sm" c="dimmed">
            Note: California uses object name <Code>zcta_simplified</Code> instead of the standard
            pattern.
          </Text>
        </Stack>

        <Divider label="Data Integration" labelPosition="left" />

        <Stack gap="sm">
          <Title order={4}>Integrating Your Data</Title>
          <Text size="sm">
            To populate the map with real data from an API endpoint using TanStack Query:
          </Text>
          <Code block>
            {`import { useQuery } from '@tanstack/react-query';
import { ZipMap } from './components/ZipMap';
import { ZipDataPoint } from './components/ZipMap/types';

interface ApiResponse {
  zip: string;
  accountCount: number;
}

function AccountsMap() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['accounts-by-zipcode'],
    queryFn: async (): Promise<ZipDataPoint[]> => {
      const res = await fetch('/api/accounts-by-zipcode');
      const json: ApiResponse[] = await res.json();
      return json.map(item => ({
        zipCode: item.zip,
        value: item.accountCount,
      }));
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;

  return <ZipMap data={data ?? []} width={960} height={600} />;
}`}
          </Code>
        </Stack>

        <Stack gap="sm">
          <Title order={4}>Spring Boot Backend Example</Title>
          <Text size="sm">
            Example Spring Boot controller to serve ZCTA TopoJSON files from S3:
          </Text>
          <Code block>
            {`// ZctaController.java
@RestController
@RequestMapping("/api/zcta")
public class ZctaController {

    private final S3Client s3Client;
    private static final String BUCKET = "state-zipcode-geo-data";

    public ZctaController(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    @GetMapping("/{fips}.topojson")
    public ResponseEntity<byte[]> getStateZcta(@PathVariable String fips) {
        try {
            GetObjectRequest request = GetObjectRequest.builder()
                .bucket(BUCKET)
                .key("zcta/" + fips + ".topojson")
                .build();

            byte[] content = s3Client.getObjectAsBytes(request).asByteArray();

            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .cacheControl(CacheControl.maxAge(Duration.ofDays(7)))
                .body(content);
        } catch (NoSuchKeyException e) {
            return ResponseEntity.notFound().build();
        }
    }
}

// S3Config.java
@Configuration
public class S3Config {

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
            .region(Region.US_EAST_1)
            .build();
    }
}`}
          </Code>
          <Text size="sm" c="dimmed">
            Update the frontend <Code>zctaLoader.ts</Code> to fetch from{' '}
            <Code>/api/zcta/{'{fips}'}.topojson</Code> instead of <Code>/zcta/</Code>.
          </Text>
        </Stack>

        <Stack gap="sm">
          <Title order={4}>Expected Data Format</Title>
          <Code block>
            {`interface ZipDataPoint {
  zipCode: string;  // 5-digit zip code, e.g., "90210"
  value: number;    // Numeric value for color scale
}

// Example data
const data: ZipDataPoint[] = [
  { zipCode: "90210", value: 5420 },
  { zipCode: "10001", value: 12350 },
  { zipCode: "77001", value: 8900 },
];`}
          </Code>
        </Stack>

        <Divider label="Frontend Implementation" labelPosition="left" />

        <Stack gap="sm">
          <Title order={4}>Key Dependencies</Title>
          <Code block>
            {`npm install d3 topojson-client
npm install -D @types/d3 @types/topojson-client`}
          </Code>
        </Stack>

        <Stack gap="sm">
          <Title order={4}>Component Props</Title>
          <Code block>
            {`interface ZipMapProps {
  data: ZipDataPoint[];  // Required: zip codes with values
  width?: number;        // Optional: SVG width (default: 960)
  height?: number;       // Optional: SVG height (default: 600)
}`}
          </Code>
        </Stack>

        <Stack gap="sm">
          <Title order={4}>Projection Configuration</Title>
          <Text size="sm">
            The map uses D3's Albers USA projection, which includes insets for Alaska and Hawaii:
          </Text>
          <Code block>
            {`const projection = d3.geoAlbersUsa()
  .scale(1300)
  .translate([width / 2, height / 2]);

const path = d3.geoPath(projection);`}
          </Code>
        </Stack>

        <Stack gap="sm">
          <Title order={4}>Color Scale</Title>
          <Text size="sm">
            Values are mapped to colors using D3's sequential scale with the Blues interpolator:
          </Text>
          <Code block>
            {`import * as d3 from 'd3';

const scale = d3.scaleSequential(d3.interpolateBlues)
  .domain([minValue, maxValue]);

// Usage
const color = scale(dataPoint.value);`}
          </Code>
        </Stack>

        <Stack gap="sm">
          <Title order={4}>Zip Code to State Mapping</Title>
          <Text size="sm">Zip codes are mapped to states using their 3-digit prefix:</Text>
          <Code block>
            {`// stateUtils.ts
const ZIP_PREFIX_TO_STATE: Record<string, string> = {
  '900': 'CA', '901': 'CA', // ... Los Angeles
  '100': 'NY', '101': 'NY', // ... New York City
  '770': 'TX', '771': 'TX', // ... Houston
  // ... complete mapping for all US zip prefixes
};

export function getStateFipsFromZip(zipCode: string): string | null {
  const prefix = zipCode.slice(0, 3);
  const state = ZIP_PREFIX_TO_STATE[prefix];
  return state ? STATE_FIPS[state] : null;
}`}
          </Code>
        </Stack>

        <Divider label="File Structure" labelPosition="left" />

        <Code block>
          {`src/components/ZipMap/
├── ZipMap.tsx        # Main component with map rendering
├── types.ts          # TypeScript interfaces
├── colorScale.ts     # D3 color scale utility
├── stateUtils.ts     # Zip-to-state FIPS mapping
├── zctaLoader.ts     # TopoJSON fetching utilities
├── index.ts          # Public exports
└── Documentation.tsx # This documentation component

public/zcta/
├── 01.topojson       # Alabama
├── 02.topojson       # Alaska
├── ...
└── 56.topojson       # Wyoming`}
        </Code>

        <Divider label="Performance Considerations" labelPosition="left" />

        <Stack gap="sm">
          <List size="sm" spacing="xs">
            <List.Item>
              <strong>Lazy Loading:</strong> ZCTA files are only fetched for states that have data
              points
            </List.Item>
            <List.Item>
              <strong>File Sizes:</strong> Individual state files range from 30KB (DC) to 2.4MB
              (Texas)
            </List.Item>
            <List.Item>
              <strong>Caching:</strong> Consider adding HTTP caching headers for ZCTA files in
              production
            </List.Item>
            <List.Item>
              <strong>Simplification:</strong> TopoJSON files are pre-simplified to 10% to reduce
              size
            </List.Item>
            <List.Item>
              <strong>SVG vs Canvas:</strong> Current implementation uses SVG; for 10,000+ zip
              codes, consider Canvas
            </List.Item>
          </List>
        </Stack>

        <Divider label="Interaction Features" labelPosition="left" />

        <Stack gap="sm">
          <List size="sm" spacing="xs">
            <List.Item>
              <strong>Zoom/Pan:</strong> Mouse wheel to zoom, drag to pan (up to 25x zoom)
            </List.Item>
            <List.Item>
              <strong>Click State:</strong> Zooms and centers on the clicked state
            </List.Item>
            <List.Item>
              <strong>Click Zip:</strong> Zooms to parent state
            </List.Item>
            <List.Item>
              <strong>Double-click:</strong> Resets zoom to full US view
            </List.Item>
            <List.Item>
              <strong>Hover Zip:</strong> Shows tooltip and scales up the zip code 1.5x
            </List.Item>
            <List.Item>
              <strong>Side Panel:</strong> Lists states or zip codes with click-to-zoom
            </List.Item>
          </List>
        </Stack>

        <Divider label="References" labelPosition="left" />

        <Stack gap="xs">
          <Anchor href="https://github.com/topojson/us-atlas" target="_blank" size="sm">
            US Atlas TopoJSON
          </Anchor>
          <Anchor href="https://github.com/d3/d3-geo" target="_blank" size="sm">
            D3 Geo Documentation
          </Anchor>
          <Anchor
            href="https://github.com/OpenDataDE/State-zip-code-GeoJSON"
            target="_blank"
            size="sm"
          >
            Original ZCTA GeoJSON Source
          </Anchor>
        </Stack>
      </Stack>
    </Paper>
  );
}
