import earcut from 'earcut';
import * as d3 from 'd3';

export interface TessellatedGeometry {
  vertices: Float32Array;
  color: [number, number, number];
  id: string;
}

// Albers USA projection for converting lat/lon to screen coordinates
const projection = d3.geoAlbersUsa().scale(1300).translate([480, 300]);

export function tessellateGeometry(
  geometry: any,
  color: [number, number, number],
  id: string
): TessellatedGeometry | null {
  const vertices: number[] = [];

  function processPolygon(coords: number[][][]) {
    coords.forEach((ring) => {
      const flatCoords: number[] = [];
      const projectedCoords: number[] = [];

      ring.forEach(([lon, lat]) => {
        const projected = projection([lon, lat]);
        if (projected) {
          projectedCoords.push(projected[0], projected[1]);
          flatCoords.push(projected[0], projected[1]);
        }
      });

      if (flatCoords.length < 6) return; // Need at least 3 points

      try {
        const triangles = earcut(flatCoords);
        for (let i = 0; i < triangles.length; i++) {
          const idx = triangles[i] * 2;
          vertices.push(flatCoords[idx], flatCoords[idx + 1]);
        }
      } catch (e) {
        console.warn('Tessellation failed for polygon:', e);
      }
    });
  }

  if (geometry.type === 'Polygon') {
    processPolygon(geometry.coordinates);
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((polygon: number[][][]) => {
      processPolygon(polygon);
    });
  }

  if (vertices.length === 0) return null;

  return {
    vertices: new Float32Array(vertices),
    color,
    id,
  };
}

export function createColorScale(values: number[]): (value: number) => [number, number, number] {
  if (values.length === 0) return () => [0.8, 0.8, 0.8];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const scale = d3.scaleSequential(d3.interpolateBlues).domain([min, max]);

  return (value: number) => {
    const colorStr = scale(value);
    const rgb = d3.rgb(colorStr);
    return [rgb.r / 255, rgb.g / 255, rgb.b / 255];
  };
}
