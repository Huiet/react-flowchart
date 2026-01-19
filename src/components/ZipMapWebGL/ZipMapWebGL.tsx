import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { getStateFipsFromZip, loadAndProcessGeometries } from './geometryProcessor';
import { WebGLRenderer } from './renderer';
import { ZipMapWebGLProps } from './types';

const US_STATES_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

const FIPS_TO_NAME: Record<string, string> = {
  '01': 'Alabama',
  '02': 'Alaska',
  '04': 'Arizona',
  '05': 'Arkansas',
  '06': 'California',
  '08': 'Colorado',
  '09': 'Connecticut',
  '10': 'Delaware',
  '11': 'DC',
  '12': 'Florida',
  '13': 'Georgia',
  '15': 'Hawaii',
  '16': 'Idaho',
  '17': 'Illinois',
  '18': 'Indiana',
  '19': 'Iowa',
  '20': 'Kansas',
  '21': 'Kentucky',
  '22': 'Louisiana',
  '23': 'Maine',
  '24': 'Maryland',
  '25': 'Massachusetts',
  '26': 'Michigan',
  '27': 'Minnesota',
  '28': 'Mississippi',
  '29': 'Missouri',
  '30': 'Montana',
  '31': 'Nebraska',
  '32': 'Nevada',
  '33': 'New Hampshire',
  '34': 'New Jersey',
  '35': 'New Mexico',
  '36': 'New York',
  '37': 'North Carolina',
  '38': 'North Dakota',
  '39': 'Ohio',
  '40': 'Oklahoma',
  '41': 'Oregon',
  '42': 'Pennsylvania',
  '44': 'Rhode Island',
  '45': 'South Carolina',
  '46': 'South Dakota',
  '47': 'Tennessee',
  '48': 'Texas',
  '49': 'Utah',
  '50': 'Vermont',
  '51': 'Virginia',
  '53': 'Washington',
  '54': 'West Virginia',
  '55': 'Wisconsin',
  '56': 'Wyoming',
};

export function ZipMapWebGL({ data, width = 960, height = 600 }: ZipMapWebGLProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [geometries, setGeometries] = useState<any>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showFiveDigit, setShowFiveDigit] = useState(false);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const animationRef = useRef<number | null>(null);

  // Calculate initial center position
  useEffect(() => {
    // Projection is centered at [480, 300] with scale 1300
    // We need to center this in our canvas
    const projectionCenterX = 480;
    const projectionCenterY = 300;
    const initialX = width / 2 - projectionCenterX;
    const initialY = height / 2 - projectionCenterY;
    setTransform({ x: initialX, y: initialY, scale: 1 });
  }, [width, height]);
  const [usTopology, setUsTopology] = useState<any>(null);
  const [activeState, setActiveState] = useState<string | null>(null);
  const [hoveredZip, setHoveredZip] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    zip: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);
  const [showZipBorders, setShowZipBorders] = useState(false);
  const [showStateColors, setShowStateColors] = useState(false);
  const isDragging = useRef(false);
  const dragDistance = useRef(0);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Animate transform changes
  const animateTo = (target: { x: number; y: number; scale: number }, duration = 400) => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    const start = { ...transform };
    const startTime = performance.now();
    const animate = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setTransform({
        x: start.x + (target.x - start.x) * ease,
        y: start.y + (target.y - start.y) * ease,
        scale: start.scale + (target.scale - start.scale) * ease,
      });
      setZoomLevel(start.scale + (target.scale - start.scale) * ease);
      if (t < 1) animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
  };

  // Get zip codes for active state
  const activeStateZips = useMemo(() => {
    if (!activeState) return [];
    return data
      .filter((d) => getStateFipsFromZip(d.zipCode) === activeState)
      .sort((a, b) => b.value - a.value);
  }, [activeState, data]);

  // Get 3-digit areas for active state
  const activeState3Digit = useMemo(() => {
    if (!activeState || !geometries) return [];
    const prefixes = new Map<string, { prefix: string; total: number; count: number }>();
    activeStateZips.forEach((zip) => {
      const prefix = zip.zipCode.substring(0, 3);
      const existing = prefixes.get(prefix);
      if (existing) {
        existing.total += zip.value;
        existing.count++;
      } else {
        prefixes.set(prefix, { prefix, total: zip.value, count: 1 });
      }
    });
    return Array.from(prefixes.values()).sort((a, b) => b.total - a.total);
  }, [activeState, activeStateZips, geometries]);

  // Aggregate data by state
  const stateSummaries = useMemo(() => {
    const summaries = new Map<
      string,
      { fips: string; name: string; count: number; total: number }
    >();
    data.forEach((d) => {
      const fips = getStateFipsFromZip(d.zipCode);
      if (!fips) return;
      const existing = summaries.get(fips);
      if (existing) {
        existing.count++;
        existing.total += d.value;
      } else {
        summaries.set(fips, {
          fips,
          name: FIPS_TO_NAME[fips] || fips,
          count: 1,
          total: d.value,
        });
      }
    });
    return Array.from(summaries.values()).sort((a, b) => b.total - a.total);
  }, [data]);

  // Color scale for states
  const stateColorScale = useMemo(() => {
    if (stateSummaries.length === 0) return (v: number) => '#ddd';
    const totals = stateSummaries.map((s) => s.total);
    const scale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([Math.min(...totals), Math.max(...totals)]);
    return (value: number) => scale(value);
  }, [stateSummaries]);

  // Color scale for active state zip codes (5-digit)
  const zipColorScale = useMemo(() => {
    if (activeStateZips.length === 0) return (v: number) => '#ddd';
    const values = activeStateZips.map((z) => z.value);
    const scale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([Math.min(...values), Math.max(...values)]);
    return (value: number) => scale(value);
  }, [activeStateZips]);

  // Color scale for active state 3-digit areas
  const threeDigitColorScale = useMemo(() => {
    if (activeState3Digit.length === 0) return (v: number) => '#ddd';
    const totals = activeState3Digit.map((a) => a.total);
    const scale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([Math.min(...totals), Math.max(...totals)]);
    return (value: number) => scale(value);
  }, [activeState3Digit]);

  // Load US states topology
  useEffect(() => {
    fetch(US_STATES_URL)
      .then((r) => r.json())
      .then(setUsTopology);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const gl = canvasRef.current.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    glRef.current = gl;
    gl.viewport(0, 0, width, height);
    gl.clearColor(0.98, 0.98, 0.98, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    rendererRef.current = new WebGLRenderer(gl, width, height);
    setIsReady(true);
  }, [width, height]);

  useEffect(() => {
    if (!isReady) return;

    setIsLoading(true);
    loadAndProcessGeometries(data).then((geoms) => {
      setGeometries(geoms);
      setIsLoading(false);
      console.log('Geometries loaded:', {
        fiveDigit: geoms.fiveDigit.size,
        threeDigit: geoms.threeDigit.size,
      });
    });
  }, [data, isReady]);

  // Render when geometries or transform changes
  useEffect(() => {
    if (!geometries || !rendererRef.current || !usTopology) return;

    // Build combined buffers: 3-digit for all states, plus detail for active state
    const buffers = new Map<string, any>();

    // Add all 3-digit areas first
    geometries.threeDigitFullBuffers.forEach((value: any, key: string) => {
      // Only skip active state's 3-digit areas if showing 5-digit detail
      if (activeState && showFiveDigit) {
        const belongsToActiveState = activeState3Digit.some((a) => a.prefix === key);
        if (belongsToActiveState) return;
      }
      buffers.set(key, value);
    });

    // Add active state 5-digit detail if toggled on
    if (activeState && showFiveDigit) {
      activeStateZips.forEach((zip) => {
        if (geometries.fiveDigitBuffers.has(zip.zipCode)) {
          buffers.set(zip.zipCode, geometries.fiveDigitBuffers.get(zip.zipCode));
        }
      });
    }

    // Get state borders
    const stateMesh = topojson.mesh(
      usTopology,
      usTopology.objects.states,
      (a: any, b: any) => a !== b
    );

    // Get nation borders
    const nationMesh = topojson.mesh(
      usTopology,
      usTopology.objects.states,
      (a: any, b: any) => a === b
    );

    // Get zip code borders if enabled
    let zipBorders = null;
    if (showZipBorders && geometries && activeState) {
      const projection = d3.geoAlbersUsa().scale(1300).translate([480, 300]);
      const allZips = geometries.allZipsByState.get(activeState);

      if (allZips) {
        const borderVertices: number[] = [];

        // Group by 3-digit if zoomed out
        if (zoomLevel < 4) {
          const grouped = new Map<string, any[]>();
          allZips.forEach((feature: any) => {
            const zipCode = feature.properties.ZCTA5CE10;
            const prefix = zipCode.substring(0, 3);
            if (!grouped.has(prefix)) grouped.set(prefix, []);
            grouped.get(prefix)!.push(feature);
          });

          grouped.forEach((features) => {
            features.forEach((feature: any) => {
              const coords =
                feature.geometry.type === 'Polygon'
                  ? [feature.geometry.coordinates]
                  : feature.geometry.coordinates;

              coords.forEach((polygon: number[][][]) => {
                polygon.forEach((ring: number[][]) => {
                  for (let i = 0; i < ring.length - 1; i++) {
                    const p1 = projection(ring[i]);
                    const p2 = projection(ring[i + 1]);
                    if (p1 && p2) {
                      borderVertices.push(p1[0], p1[1], p2[0], p2[1]);
                    }
                  }
                });
              });
            });
          });
        } else {
          // Show all individual zip borders when zoomed in
          allZips.forEach((feature: any) => {
            const coords =
              feature.geometry.type === 'Polygon'
                ? [feature.geometry.coordinates]
                : feature.geometry.coordinates;

            coords.forEach((polygon: number[][][]) => {
              polygon.forEach((ring: number[][]) => {
                for (let i = 0; i < ring.length - 1; i++) {
                  const p1 = projection(ring[i]);
                  const p2 = projection(ring[i + 1]);
                  if (p1 && p2) {
                    borderVertices.push(p1[0], p1[1], p2[0], p2[1]);
                  }
                }
              });
            });
          });
        }

        zipBorders = borderVertices;
      }
    }

    // Create state-colored geometries if enabled (only when no state is selected)
    let stateGeometries = null;
    if (showStateColors && !activeState && usTopology) {
      const states = topojson.feature(usTopology, usTopology.objects.states) as any;
      const projection = d3.geoAlbersUsa().scale(1300).translate([480, 300]);

      stateGeometries = new Map<string, any>();
      states.features.forEach((stateFeature: any) => {
        const fips = stateFeature.id;
        const stateSummary = stateSummaries.find((s) => s.fips === fips);
        if (stateSummary) {
          const color = d3.rgb(stateColorScale(stateSummary.total));
          stateGeometries.set(fips, {
            geometry: stateFeature.geometry,
            color: [color.r / 255, color.g / 255, color.b / 255],
            projection,
          });
        }
      });
    }

    rendererRef.current.render(
      buffers,
      transform,
      stateMesh,
      nationMesh,
      zipBorders,
      hoveredZip,
      stateGeometries
    );
  }, [
    geometries,
    transform,
    zoomLevel,
    usTopology,
    showZipBorders,
    hoveredZip,
    activeState,
    showStateColors,
    stateSummaries,
    stateColorScale,
    showFiveDigit,
    activeStateZips,
    activeState3Digit,
  ]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    setIsDraggingState(true);
    dragDistance.current = 0;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;

      dragDistance.current += Math.abs(dx) + Math.abs(dy);

      setTransform((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      lastMouse.current = { x: e.clientX, y: e.clientY };
      setTooltip(null);
    } else {
      // Hit detection for hover
      if (!geometries || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Convert to world coordinates
      const worldX = (mouseX - transform.x) / transform.scale;
      const worldY = (mouseY - transform.y) / transform.scale;

      const projection = d3.geoAlbersUsa().scale(1300).translate([480, 300]);
      const path = d3.geoPath(projection);
      const useHighDetail = zoomLevel >= 4;
      const dataSource = useHighDetail ? geometries.fiveDigit : geometries.threeDigit;

      let found = false;
      for (const [id, geom] of dataSource.entries()) {
        const bounds = path.bounds(geom.geometry);
        const [[x0, y0], [x1, y1]] = bounds;

        // Simple bounding box check
        if (worldX >= x0 && worldX <= x1 && worldY >= y0 && worldY <= y1) {
          const value = useHighDetail ? geom.value : geom.totalValue;
          setHoveredZip(id);
          setTooltip({ zip: id, value, x: e.clientX, y: e.clientY });
          found = true;
          break;
        }
      }

      if (!found) {
        setHoveredZip(null);
        setTooltip(null);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // If drag distance is small, treat as click
    if (isDragging.current && dragDistance.current < 5 && usTopology) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldX = (mouseX - transform.x) / transform.scale;
      const worldY = (mouseY - transform.y) / transform.scale;

      const projection = d3.geoAlbersUsa().scale(1300).translate([480, 300]);
      const path = d3.geoPath(projection);
      const states = topojson.feature(usTopology, usTopology.objects.states) as any;

      // Find clicked state
      for (const stateFeature of states.features) {
        const bounds = path.bounds(stateFeature);
        const [[x0, y0], [x1, y1]] = bounds;

        if (worldX >= x0 && worldX <= x1 && worldY >= y0 && worldY <= y1) {
          const fips = stateFeature.id;
          const stateSummary = stateSummaries.find((s) => s.fips === fips);

          if (stateSummary) {
            setActiveState(fips);

            // Zoom to state with animation
            const dx = x1 - x0;
            const dy = y1 - y0;
            const x = (x0 + x1) / 2;
            const y = (y0 + y1) / 2;
            const scale = Math.min(8, 0.9 / Math.max(dx / width, dy / height));

            animateTo({
              x: width / 2 - x * scale,
              y: height / 2 - y * scale,
              scale,
            });
            break;
          }
        }
      }
    }

    isDragging.current = false;
    setIsDraggingState(false);
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    setIsDraggingState(false);
    setTooltip(null);
    setHoveredZip(null);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.2 : 0.83;
      const newScale = Math.max(1, Math.min(100, transform.scale * zoomFactor));

      if (newScale === transform.scale) return;

      // Zoom towards mouse position in world space
      const worldX = (mouseX - transform.x) / transform.scale;
      const worldY = (mouseY - transform.y) / transform.scale;

      const newX = mouseX - worldX * newScale;
      const newY = mouseY - worldY * newScale;

      setTransform({
        x: newX,
        y: newY,
        scale: newScale,
      });
      setZoomLevel(newScale);
    };

    canvas.addEventListener('wheel', handleWheelEvent, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheelEvent);
  }, [transform]);

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{
            border: '1px solid #ddd',
            borderRadius: 8,
            background: '#fafafa',
            cursor: isDraggingState ? 'grabbing' : 'grab',
          }}
        />
        {!isReady && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 14,
              color: '#666',
            }}
          >
            Initializing WebGL...
          </div>
        )}
        {isReady && isLoading && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 14,
              color: '#666',
            }}
          >
            Loading geometries...
          </div>
        )}

        {/* Zoom controls */}
        {!isLoading && geometries && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              background: '#fff',
              borderRadius: 8,
              padding: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <button
              onClick={() => {
                const centerX = width / 2;
                const centerY = height / 2;
                const zoomFactor = 1.5;
                const newScale = Math.min(100, zoomLevel * zoomFactor);

                // Zoom towards center
                const worldX = (centerX - transform.x) / transform.scale;
                const worldY = (centerY - transform.y) / transform.scale;

                const newX = centerX - worldX * newScale;
                const newY = centerY - worldY * newScale;

                setTransform({ x: newX, y: newY, scale: newScale });
                setZoomLevel(newScale);
              }}
              style={btnStyle}
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={() => {
                const centerX = width / 2;
                const centerY = height / 2;
                const zoomFactor = 0.67;
                const newScale = Math.max(1, zoomLevel * zoomFactor);

                // Zoom towards center
                const worldX = (centerX - transform.x) / transform.scale;
                const worldY = (centerY - transform.y) / transform.scale;

                const newX = centerX - worldX * newScale;
                const newY = centerY - worldY * newScale;

                setTransform({ x: newX, y: newY, scale: newScale });
                setZoomLevel(newScale);
              }}
              style={btnStyle}
              title="Zoom Out"
            >
              −
            </button>
            <div style={{ height: 1, background: '#eee', margin: '4px 0' }} />
            <button
              onClick={() => {
                const projectionCenterX = 480;
                const projectionCenterY = 300;
                const initialX = width / 2 - projectionCenterX;
                const initialY = height / 2 - projectionCenterY;
                animateTo({ x: initialX, y: initialY, scale: 1 });
                setActiveState(null);
              }}
              disabled={(() => {
                const initialX = width / 2 - 480;
                const initialY = height / 2 - 300;
                const isAtInitial =
                  Math.abs(transform.x - initialX) < 1 &&
                  Math.abs(transform.y - initialY) < 1 &&
                  transform.scale <= 1.01;
                return isAtInitial && !activeState;
              })()}
              style={{
                ...btnStyle,
                color: (() => {
                  const initialX = width / 2 - 480;
                  const initialY = height / 2 - 300;
                  const isAtInitial =
                    Math.abs(transform.x - initialX) < 1 &&
                    Math.abs(transform.y - initialY) < 1 &&
                    transform.scale <= 1.01;
                  return !isAtInitial || activeState ? '#333' : '#aaa';
                })(),
                background: (() => {
                  const initialX = width / 2 - 480;
                  const initialY = height / 2 - 300;
                  const isAtInitial =
                    Math.abs(transform.x - initialX) < 1 &&
                    Math.abs(transform.y - initialY) < 1 &&
                    transform.scale <= 1.01;
                  return !isAtInitial || activeState ? '#fff' : '#f5f5f5';
                })(),
              }}
              title="Reset View"
            >
              ⌂
            </button>
          </div>
        )}

        {/* Zoom level and LOD indicator */}
        {!isLoading && geometries && zoomLevel > 1.1 && (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              background: 'rgba(0,0,0,0.7)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            <div>{Math.round(zoomLevel * 100)}%</div>
            <div style={{ fontSize: 10, color: '#ccc', marginTop: 2 }}>
              {zoomLevel >= 4 ? '5-digit detail' : '3-digit areas'}
            </div>
          </div>
        )}

        {/* Tooltip */}
        {tooltip && (
          <div
            style={{
              position: 'fixed',
              left: tooltip.x + 15,
              top: tooltip.y - 10,
              background: 'rgba(0,0,0,0.9)',
              color: '#fff',
              padding: '10px 14px',
              borderRadius: 6,
              fontSize: 14,
              pointerEvents: 'none',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {zoomLevel >= 4 ? `ZIP ${tooltip.zip}` : `${tooltip.zip}xx Area`}
            </div>
            <div style={{ color: '#ccc' }}>
              Value: <span style={{ color: '#fff' }}>{tooltip.value.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          width: 280,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxHeight: height + 60,
        }}
      >
        {/* Legend */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            background: '#fff',
            borderRadius: 8,
            border: '1px solid #eee',
          }}
        >
          <span style={{ fontSize: 13, color: '#666' }}>Low</span>
          <div
            style={{
              flex: 1,
              height: 14,
              background: `linear-gradient(to right, ${d3.interpolateBlues(0)}, ${d3.interpolateBlues(0.25)}, ${d3.interpolateBlues(0.5)}, ${d3.interpolateBlues(0.75)}, ${d3.interpolateBlues(1)})`,
              borderRadius: 3,
              border: '1px solid #ddd',
            }}
          />
          <span style={{ fontSize: 13, color: '#666' }}>High</span>
        </div>

        {/* Show zip borders toggle */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: '#fff',
            borderRadius: 8,
            border: '1px solid #eee',
            cursor: 'pointer',
            fontSize: 13,
            color: '#666',
          }}
        >
          <input
            type="checkbox"
            checked={showZipBorders}
            onChange={(e) => setShowZipBorders(e.target.checked)}
          />
          Show zip code borders
        </label>

        {/* Show state colors toggle */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: '#fff',
            borderRadius: 8,
            border: '1px solid #eee',
            cursor: 'pointer',
            fontSize: 13,
            color: '#666',
          }}
        >
          <input
            type="checkbox"
            checked={showStateColors}
            onChange={(e) => setShowStateColors(e.target.checked)}
          />
          Color states (instead of zip codes)
        </label>

        {/* States list or zip codes table */}
        <div
          style={{
            flex: 1,
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: 8,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {activeState ? (
            <>
              {/* State header */}
              <div
                style={{
                  padding: '16px',
                  borderBottom: '1px solid #eee',
                  background: '#f8f8f8',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <h3 style={{ margin: 0, fontSize: 16 }}>
                    {FIPS_TO_NAME[activeState] || activeState}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const projectionCenterX = 480;
                      const projectionCenterY = 300;
                      const initialX = width / 2 - projectionCenterX;
                      const initialY = height / 2 - projectionCenterY;
                      animateTo({ x: initialX, y: initialY, scale: 1 });
                      setActiveState(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 18,
                      cursor: 'pointer',
                      color: '#666',
                      padding: '4px 8px',
                    }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                  {showFiveDigit
                    ? `${activeStateZips.length} zip codes`
                    : `${activeState3Digit.length} 3-digit areas`}
                </div>
                {/* 3-digit vs 5-digit toggle */}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => setShowFiveDigit(false)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      background: !showFiveDigit ? '#e3f2fd' : '#fff',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: !showFiveDigit ? 600 : 400,
                    }}
                  >
                    3-digit
                  </button>
                  <button
                    onClick={() => setShowFiveDigit(true)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      background: showFiveDigit ? '#e3f2fd' : '#fff',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: showFiveDigit ? 600 : 400,
                    }}
                  >
                    5-digit
                  </button>
                </div>
              </div>

              {/* Zip codes table */}
              <div style={{ flex: 1, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8f8f8', zIndex: 1 }}>
                    <tr>
                      <th
                        style={{
                          padding: '10px 12px',
                          textAlign: 'left',
                          borderBottom: '1px solid #eee',
                        }}
                      >
                        {showFiveDigit ? 'Zip Code' : '3-Digit'}
                      </th>
                      <th
                        style={{
                          padding: '10px 12px',
                          textAlign: 'right',
                          borderBottom: '1px solid #eee',
                        }}
                      >
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {showFiveDigit
                      ? activeStateZips.map((item, i) => (
                          <tr
                            key={item.zipCode}
                            onMouseEnter={() => setHoveredZip(item.zipCode)}
                            onMouseLeave={() => setHoveredZip(null)}
                            onClick={() => {
                              // Zoom to zip code
                              if (geometries?.fiveDigit.has(item.zipCode)) {
                                const zipGeom = geometries.fiveDigit.get(item.zipCode);
                                const projection = d3
                                  .geoAlbersUsa()
                                  .scale(1300)
                                  .translate([480, 300]);
                                const path = d3.geoPath(projection);
                                const bounds = path.bounds(zipGeom.geometry);
                                const [[x0, y0], [x1, y1]] = bounds;
                                const dx = x1 - x0;
                                const dy = y1 - y0;
                                const x = (x0 + x1) / 2;
                                const y = (y0 + y1) / 2;
                                const scale = Math.min(15, 0.2 / Math.max(dx / width, dy / height));

                                animateTo({
                                  x: width / 2 - x * scale,
                                  y: height / 2 - y * scale,
                                  scale,
                                });
                              }
                            }}
                            style={{
                              background:
                                hoveredZip === item.zipCode
                                  ? '#f0f7ff'
                                  : i % 2 === 0
                                    ? '#fff'
                                    : '#fafafa',
                              cursor: 'pointer',
                              transition: 'background 0.15s',
                            }}
                          >
                            <td
                              style={{
                                padding: '10px 12px',
                                fontFamily: 'monospace',
                                borderLeft: `10px solid ${hoveredZip === item.zipCode ? '#f57c00' : zipColorScale(item.value)}`,
                              }}
                            >
                              {item.zipCode}
                            </td>
                            <td
                              style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 500 }}
                            >
                              {item.value.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      : activeState3Digit.map((item, i) => (
                          <tr
                            key={item.prefix}
                            onClick={() => {
                              // Zoom to 3-digit area
                              if (geometries?.threeDigit.has(item.prefix)) {
                                const areaGeom = geometries.threeDigit.get(item.prefix);
                                const projection = d3
                                  .geoAlbersUsa()
                                  .scale(1300)
                                  .translate([480, 300]);
                                const path = d3.geoPath(projection);
                                const bounds = path.bounds(areaGeom.geometry);
                                const [[x0, y0], [x1, y1]] = bounds;
                                const dx = x1 - x0;
                                const dy = y1 - y0;
                                const x = (x0 + x1) / 2;
                                const y = (y0 + y1) / 2;
                                const scale = Math.min(12, 0.5 / Math.max(dx / width, dy / height));

                                animateTo({
                                  x: width / 2 - x * scale,
                                  y: height / 2 - y * scale,
                                  scale,
                                });
                              }
                            }}
                            style={{
                              background:
                                hoveredZip === item.prefix
                                  ? '#f0f7ff'
                                  : i % 2 === 0
                                    ? '#fff'
                                    : '#fafafa',
                              cursor: 'pointer',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={() => setHoveredZip(item.prefix)}
                            onMouseLeave={() => setHoveredZip(null)}
                          >
                            <td
                              style={{
                                padding: '10px 12px',
                                fontFamily: 'monospace',
                                borderLeft: `10px solid ${hoveredZip === item.prefix ? '#f57c00' : threeDigitColorScale(item.total)}`,
                              }}
                            >
                              <div>{item.prefix}xx</div>
                              <div style={{ fontSize: 11, color: '#888' }}>
                                {item.count} zip codes
                              </div>
                            </td>
                            <td
                              style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 500 }}
                            >
                              {item.total.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              {/* States list header */}
              <div
                style={{
                  padding: '16px',
                  borderBottom: '1px solid #eee',
                  background: '#f8f8f8',
                }}
              >
                <h3 style={{ margin: 0, fontSize: 16 }}>States with Data</h3>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                  {stateSummaries.length} states •{' '}
                  {data.reduce((sum, d) => sum + d.value, 0).toLocaleString()} total
                </div>
              </div>

              {/* States table */}
              <div style={{ flex: 1, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8f8f8', zIndex: 1 }}>
                    <tr>
                      <th
                        style={{
                          padding: '10px 12px',
                          textAlign: 'left',
                          borderBottom: '1px solid #eee',
                        }}
                      >
                        State
                      </th>
                      <th
                        style={{
                          padding: '10px 12px',
                          textAlign: 'right',
                          borderBottom: '1px solid #eee',
                        }}
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stateSummaries.map((state, i) => (
                      <tr
                        key={state.fips}
                        onClick={() => {
                          setActiveState(state.fips);
                          // Zoom to state - find state bounds and zoom
                          if (usTopology) {
                            const states = topojson.feature(
                              usTopology,
                              usTopology.objects.states
                            ) as any;
                            const stateFeature = states.features.find(
                              (s: any) => s.id === state.fips
                            );
                            if (stateFeature) {
                              const projection = d3
                                .geoAlbersUsa()
                                .scale(1300)
                                .translate([480, 300]);
                              const path = d3.geoPath(projection);
                              const bounds = path.bounds(stateFeature);
                              const [[x0, y0], [x1, y1]] = bounds;
                              const dx = x1 - x0;
                              const dy = y1 - y0;
                              const x = (x0 + x1) / 2;
                              const y = (y0 + y1) / 2;
                              const scale = Math.min(8, 0.9 / Math.max(dx / width, dy / height));

                              animateTo({
                                x: width / 2 - x * scale,
                                y: height / 2 - y * scale,
                                scale,
                              });
                            }
                          }
                        }}
                        style={{
                          background: i % 2 === 0 ? '#fff' : '#fafafa',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f7ff')}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa')
                        }
                      >
                        <td
                          style={{
                            padding: '10px 12px',
                            borderLeft: `10px solid ${stateColorScale(state.total)}`,
                          }}
                        >
                          <div>{state.name}</div>
                          <div style={{ fontSize: 11, color: '#888' }}>{state.count} zip codes</div>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 500 }}>
                          {state.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  border: '1px solid #ddd',
  borderRadius: 6,
  background: '#fff',
  cursor: 'pointer',
  fontSize: 20,
  fontWeight: 'bold',
  color: '#333',
};
