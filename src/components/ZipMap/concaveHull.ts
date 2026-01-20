import concaveman from 'concaveman';

type GeoJSONPolygon = { type: 'Polygon'; coordinates: number[][][] };

/**
 * Extract all boundary points from a GeoJSON geometry (Polygon or MultiPolygon)
 */
function extractPoints(geometry: any): number[][] {
  const points: number[][] = [];

  if (geometry.type === 'Polygon') {
    geometry.coordinates[0].forEach((coord: number[]) => points.push(coord));
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((polygon: number[][][]) => {
      polygon[0].forEach((coord: number[]) => points.push(coord));
    });
  }

  return points;
}

/**
 * Generate a concave hull polygon from an array of GeoJSON features
 */
export function createConcaveHull(features: any[], concavity = 2): GeoJSONPolygon | null {
  const allPoints: number[][] = [];

  features.forEach((feature) => {
    const pts = extractPoints(feature.geometry);
    allPoints.push(...pts);
  });

  if (allPoints.length < 3) return null;

  const hull = concaveman(allPoints, concavity);
  if (hull.length < 3) return null;

  // Close the ring if not already closed
  const first = hull[0];
  const last = hull[hull.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    hull.push([...first]);
  }

  return { type: 'Polygon', coordinates: [hull] };
}
