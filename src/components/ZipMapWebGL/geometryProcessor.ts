import * as topojson from 'topojson-client';
import { fetchStateZCTA, getObjectName } from '../ZipMap/zctaLoader';
import { createColorScale, TessellatedGeometry, tessellateGeometry } from './tessellator';
import { ThreeDigitGeometry, ZipDataPoint, ZipGeometry } from './types';

interface GeometryCache {
  fiveDigit: Map<string, ZipGeometry>;
  threeDigit: Map<string, ThreeDigitGeometry>;
  threeDigitFull: Map<string, ThreeDigitGeometry>;
  fiveDigitBuffers: Map<string, TessellatedGeometry>;
  threeDigitBuffers: Map<string, TessellatedGeometry>;
  threeDigitFullBuffers: Map<string, TessellatedGeometry>;
  allZipsByState: Map<string, any[]>;
}

export async function loadAndProcessGeometries(data: ZipDataPoint[]): Promise<GeometryCache> {
  const dataMap = new Map(data.map((d) => [d.zipCode, d.value]));

  // Group zip codes by state FIPS
  const zipsByState = new Map<string, string[]>();
  data.forEach((d) => {
    const fips = getStateFipsFromZip(d.zipCode);
    if (!fips) return;
    if (!zipsByState.has(fips)) zipsByState.set(fips, []);
    zipsByState.get(fips)!.push(d.zipCode);
  });

  const fiveDigit = new Map<string, ZipGeometry>();
  const threeDigitGroups = new Map<string, { features: any[]; values: number[] }>();
  const allZipsByState = new Map<string, any[]>();

  // Load all state TopoJSON files
  await Promise.all(
    Array.from(zipsByState.entries()).map(async ([fips, zips]) => {
      const topo = await fetchStateZCTA(fips);
      if (!topo) return;

      const objName = getObjectName(fips);
      const obj = topo.objects[objName];
      if (!obj) return;

      const fc = topojson.feature(topo, obj) as any;

      // Store ALL zip geometries for this state (for borders display)
      allZipsByState.set(fips, fc.features);

      fc.features.forEach((feature: any) => {
        const zipCode = feature.properties.ZCTA5CE10;
        if (!dataMap.has(zipCode)) return;

        // Store 5-digit geometry
        fiveDigit.set(zipCode, {
          zipCode,
          geometry: feature.geometry,
          value: dataMap.get(zipCode)!,
        });

        // Group by 3-digit prefix
        const prefix = zipCode.substring(0, 3);
        if (!threeDigitGroups.has(prefix)) {
          threeDigitGroups.set(prefix, { features: [], values: [] });
        }
        const group = threeDigitGroups.get(prefix)!;
        group.features.push(feature);
        group.values.push(dataMap.get(zipCode)!);
      });
    })
  );

  // Merge 3-digit geometries
  const threeDigit = new Map<string, ThreeDigitGeometry>();

  threeDigitGroups.forEach((group, prefix) => {
    if (group.features.length === 0) return;

    // For single feature, use it directly
    if (group.features.length === 1) {
      threeDigit.set(prefix, {
        prefix,
        geometry: group.features[0].geometry,
        totalValue: group.values.reduce((sum, v) => sum + v, 0),
        zipCodes: group.features.map((f: any) => f.properties.ZCTA5CE10),
      });
      return;
    }

    // For multiple features, combine into MultiPolygon
    const coordinates: any[] = [];
    group.features.forEach((feature: any) => {
      if (feature.geometry.type === 'Polygon') {
        coordinates.push(feature.geometry.coordinates);
      } else if (feature.geometry.type === 'MultiPolygon') {
        coordinates.push(...feature.geometry.coordinates);
      }
    });

    threeDigit.set(prefix, {
      prefix,
      geometry: {
        type: 'MultiPolygon',
        coordinates,
      },
      totalValue: group.values.reduce((sum, v) => sum + v, 0),
      zipCodes: group.features.map((f: any) => f.properties.ZCTA5CE10),
    });
  });

  console.log(`Loaded ${fiveDigit.size} 5-digit zip codes`);
  console.log(`Created ${threeDigit.size} 3-digit consolidated areas`);

  // Create color scales
  const fiveDigitColorScale = createColorScale(Array.from(fiveDigit.values()).map((g) => g.value));
  const threeDigitColorScale = createColorScale(
    Array.from(threeDigit.values()).map((g) => g.totalValue)
  );

  // Tessellate 5-digit geometries
  const fiveDigitBuffers = new Map<string, TessellatedGeometry>();
  fiveDigit.forEach((geom, zipCode) => {
    const color = fiveDigitColorScale(geom.value);
    const tessellated = tessellateGeometry(geom.geometry, color, zipCode);
    if (tessellated) {
      fiveDigitBuffers.set(zipCode, tessellated);
    }
  });

  // Tessellate 3-digit geometries
  const threeDigitBuffers = new Map<string, TessellatedGeometry>();
  threeDigit.forEach((geom, prefix) => {
    const color = threeDigitColorScale(geom.totalValue);
    const tessellated = tessellateGeometry(geom.geometry, color, prefix);
    if (tessellated) {
      threeDigitBuffers.set(prefix, tessellated);
    }
  });

  console.log(`Tessellated ${fiveDigitBuffers.size} 5-digit geometries`);
  console.log(`Tessellated ${threeDigitBuffers.size} 3-digit geometries`);

  // Create full-coverage 3-digit groups (including empty zips)
  const threeDigitFullGroups = new Map<
    string,
    { features: any[]; totalValue: number; stateFips: string }
  >();
  allZipsByState.forEach((features, stateFips) => {
    features.forEach((feature: any) => {
      const zipCode = feature.properties.ZCTA5CE10;
      const prefix = zipCode.substring(0, 3);
      if (!threeDigitFullGroups.has(prefix)) {
        threeDigitFullGroups.set(prefix, { features: [], totalValue: 0, stateFips });
      }
      const group = threeDigitFullGroups.get(prefix)!;
      group.features.push(feature);
      if (dataMap.has(zipCode)) {
        group.totalValue += dataMap.get(zipCode)!;
      }
    });
  });

  // Tessellate full-coverage 3-digit geometries using topojson.merge to dissolve internal boundaries
  const threeDigitFullBuffers = new Map<string, TessellatedGeometry>();
  const threeDigitFull = new Map<string, ThreeDigitGeometry>();

  // Group by state to use topojson.merge properly
  const topoByState = new Map<string, any>();
  await Promise.all(
    Array.from(zipsByState.keys()).map(async (fips) => {
      const topo = await fetchStateZCTA(fips);
      if (topo) topoByState.set(fips, topo);
    })
  );

  threeDigitFullGroups.forEach((group, prefix) => {
    if (group.totalValue === 0) return;

    const topo = topoByState.get(group.stateFips);
    if (topo) {
      const objName = getObjectName(group.stateFips);
      const obj = topo.objects[objName];
      if (obj) {
        // Filter to only geometries in this 3-digit group
        const filteredObj = {
          type: obj.type,
          geometries: obj.geometries.filter((g: any) => {
            const zipCode = g.properties?.ZCTA5CE10;
            return zipCode && zipCode.startsWith(prefix);
          }),
        };

        if (filteredObj.geometries.length > 0) {
          // Use topojson.merge to dissolve internal boundaries
          const merged = topojson.merge(topo, filteredObj.geometries);
          threeDigitFull.set(prefix, {
            prefix,
            geometry: merged,
            totalValue: group.totalValue,
            zipCodes: group.features.map((f: any) => f.properties.ZCTA5CE10),
          });
          const color = threeDigitColorScale(group.totalValue);
          const tessellated = tessellateGeometry(merged, color, prefix);
          if (tessellated) threeDigitFullBuffers.set(prefix, tessellated);
          return;
        }
      }
    }

    // Fallback to MultiPolygon if merge fails
    const coordinates: any[] = [];
    group.features.forEach((feature: any) => {
      if (feature.geometry.type === 'Polygon') {
        coordinates.push(feature.geometry.coordinates);
      } else if (feature.geometry.type === 'MultiPolygon') {
        coordinates.push(...feature.geometry.coordinates);
      }
    });
    const geometry = { type: 'MultiPolygon' as const, coordinates };
    threeDigitFull.set(prefix, {
      prefix,
      geometry,
      totalValue: group.totalValue,
      zipCodes: group.features.map((f: any) => f.properties.ZCTA5CE10),
    });
    const color = threeDigitColorScale(group.totalValue);
    const tessellated = tessellateGeometry(geometry, color, prefix);
    if (tessellated) threeDigitFullBuffers.set(prefix, tessellated);
  });
  console.log(`Tessellated ${threeDigitFullBuffers.size} full-coverage 3-digit geometries`);

  return {
    fiveDigit,
    threeDigit,
    threeDigitFull,
    fiveDigitBuffers,
    threeDigitBuffers,
    threeDigitFullBuffers,
    allZipsByState,
  };
}

export function getStateFipsFromZip(zipCode: string): string | null {
  const zip = parseInt(zipCode);
  if (zip >= 35000 && zip <= 36999) return '01'; // AL
  if (zip >= 99500 && zip <= 99999) return '02'; // AK
  if (zip >= 85000 && zip <= 86999) return '04'; // AZ
  if (zip >= 71600 && zip <= 72999) return '05'; // AR
  if (zip >= 90000 && zip <= 96699) return '06'; // CA
  if (zip >= 80000 && zip <= 81999) return '08'; // CO
  if (zip >= 6000 && zip <= 6999) return '09'; // CT
  if (zip >= 19700 && zip <= 19999) return '10'; // DE
  if (zip >= 20000 && zip <= 20599) return '11'; // DC
  if (zip >= 32000 && zip <= 34999) return '12'; // FL
  if (zip >= 30000 && zip <= 31999) return '13'; // GA
  if (zip >= 96700 && zip <= 96899) return '15'; // HI
  if (zip >= 83200 && zip <= 83999) return '16'; // ID
  if (zip >= 60000 && zip <= 62999) return '17'; // IL
  if (zip >= 46000 && zip <= 47999) return '18'; // IN
  if (zip >= 50000 && zip <= 52999) return '19'; // IA
  if (zip >= 66000 && zip <= 67999) return '20'; // KS
  if (zip >= 40000 && zip <= 42999) return '21'; // KY
  if (zip >= 70000 && zip <= 71599) return '22'; // LA
  if (zip >= 3900 && zip <= 4999) return '23'; // ME
  if (zip >= 20600 && zip <= 21999) return '24'; // MD
  if (zip >= 1000 && zip <= 2799) return '25'; // MA
  if (zip >= 48000 && zip <= 49999) return '26'; // MI
  if (zip >= 55000 && zip <= 56999) return '27'; // MN
  if (zip >= 38600 && zip <= 39999) return '28'; // MS
  if (zip >= 63000 && zip <= 65999) return '29'; // MO
  if (zip >= 59000 && zip <= 59999) return '30'; // MT
  if (zip >= 68000 && zip <= 69999) return '31'; // NE
  if (zip >= 88900 && zip <= 89999) return '32'; // NV
  if (zip >= 3000 && zip <= 3899) return '33'; // NH
  if (zip >= 7000 && zip <= 8999) return '34'; // NJ
  if (zip >= 87000 && zip <= 88499) return '35'; // NM
  if (zip >= 10000 && zip <= 14999) return '36'; // NY
  if (zip >= 27000 && zip <= 28999) return '37'; // NC
  if (zip >= 58000 && zip <= 58999) return '38'; // ND
  if (zip >= 43000 && zip <= 45999) return '39'; // OH
  if (zip >= 73000 && zip <= 74999) return '40'; // OK
  if (zip >= 97000 && zip <= 97999) return '41'; // OR
  if (zip >= 15000 && zip <= 19699) return '42'; // PA
  if (zip >= 2800 && zip <= 2999) return '44'; // RI
  if (zip >= 29000 && zip <= 29999) return '45'; // SC
  if (zip >= 57000 && zip <= 57999) return '46'; // SD
  if (zip >= 37000 && zip <= 38599) return '47'; // TN
  if ((zip >= 75000 && zip <= 79999) || (zip >= 88500 && zip <= 88599)) return '48'; // TX
  if (zip >= 84000 && zip <= 84999) return '49'; // UT
  if (zip >= 5000 && zip <= 5999) return '50'; // VT
  if (zip >= 22000 && zip <= 24699) return '51'; // VA
  if (zip >= 98000 && zip <= 99499) return '53'; // WA
  if (zip >= 24700 && zip <= 26999) return '54'; // WV
  if (zip >= 53000 && zip <= 54999) return '55'; // WI
  if (zip >= 82000 && zip <= 83199) return '56'; // WY
  return null;
}
