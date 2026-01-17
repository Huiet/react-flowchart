import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import RBush from 'rbush';
import { ZipMapProps } from '../ZipMap/types';
import { createColorScale } from '../ZipMap/colorScale';
import { getStateFipsFromZip } from '../ZipMap/stateUtils';
import { fetchStateZCTA, getObjectName } from '../ZipMap/zctaLoader';

const US_STATES_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';
const MIN_ZOOM = 1;
const MAX_ZOOM = 25;

const FIPS_TO_NAME: Record<string, string> = {
  '01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas', '06': 'California',
  '08': 'Colorado', '09': 'Connecticut', '10': 'Delaware', '11': 'DC', '12': 'Florida',
  '13': 'Georgia', '15': 'Hawaii', '16': 'Idaho', '17': 'Illinois', '18': 'Indiana',
  '19': 'Iowa', '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana', '23': 'Maine',
  '24': 'Maryland', '25': 'Massachusetts', '26': 'Michigan', '27': 'Minnesota', '28': 'Mississippi',
  '29': 'Missouri', '30': 'Montana', '31': 'Nebraska', '32': 'Nevada', '33': 'New Hampshire',
  '34': 'New Jersey', '35': 'New Mexico', '36': 'New York', '37': 'North Carolina', '38': 'North Dakota',
  '39': 'Ohio', '40': 'Oklahoma', '41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island',
  '45': 'South Carolina', '46': 'South Dakota', '47': 'Tennessee', '48': 'Texas', '49': 'Utah',
  '50': 'Vermont', '51': 'Virginia', '53': 'Washington', '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming',
};

interface Transform {
  x: number;
  y: number;
  k: number;
}

interface ZipBBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  zipCode: string;
  feature: any;
}

// Easing function for smooth animations
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function ZipMapCanvas({ data, width = 960, height = 600 }: ZipMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [usTopology, setUsTopology] = useState<any>(null);
  const [zctaByState, setZctaByState] = useState<Map<string, any[]>>(new Map());
  const [showEmptyZips, setShowEmptyZips] = useState(false);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const [hoveredZip, setHoveredZip] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeState, setActiveState] = useState<string | null>(null);
  const isDragging = useRef(false);
  const dragDistance = useRef(0);
  const lastMouse = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);

  const dataMap = useMemo(() => new Map(data.map((d) => [d.zipCode, d.value])), [data]);
  const colorScale = useMemo(() => createColorScale(data.map((d) => d.value)), [data]);

  const stateFipsList = useMemo(() => {
    const fips = new Set<string>();
    data.forEach((d) => {
      const f = getStateFipsFromZip(d.zipCode);
      if (f) fips.add(f);
    });
    return Array.from(fips);
  }, [data]);

  // State summaries for side panel
  const stateSummaries = useMemo(() => {
    const summaries = new Map<string, { fips: string; name: string; count: number; total: number }>();
    data.forEach((d) => {
      const fips = getStateFipsFromZip(d.zipCode);
      if (!fips) return;
      const existing = summaries.get(fips);
      if (existing) {
        existing.count++;
        existing.total += d.value;
      } else {
        summaries.set(fips, { fips, name: FIPS_TO_NAME[fips] || fips, count: 1, total: d.value });
      }
    });
    return Array.from(summaries.values()).sort((a, b) => b.total - a.total);
  }, [data]);

  // Color scale for state totals in panel
  const stateColorScale = useMemo(() => {
    if (stateSummaries.length === 0) return { scale: () => '#ddd' };
    const totals = stateSummaries.map((s) => s.total);
    return { scale: d3.scaleSequential(d3.interpolateBlues).domain([Math.min(...totals), Math.max(...totals)]) };
  }, [stateSummaries]);

  // Zip codes for active state
  const activeStateZips = useMemo(() => {
    if (!activeState) return [];
    return data
      .filter((d) => getStateFipsFromZip(d.zipCode) === activeState)
      .sort((a, b) => b.value - a.value);
  }, [activeState, data]);

  const projection = useMemo(
    () => d3.geoAlbersUsa().scale(1300).translate([width / 2, height / 2]),
    [width, height]
  );

  const allZctaFeatures = useMemo(() => {
    const all: any[] = [];
    zctaByState.forEach((features) => all.push(...features));
    return all;
  }, [zctaByState]);

  // Build RBush spatial index for ALL zip codes (for viewport culling)
  const allZipIndex = useMemo(() => {
    const tree = new RBush<ZipBBox>();
    const path = d3.geoPath(projection);

    const items: ZipBBox[] = [];
    allZctaFeatures.forEach((feature: any) => {
      const bounds = path.bounds(feature);
      if (!bounds || !isFinite(bounds[0][0])) return;

      items.push({
        minX: bounds[0][0],
        minY: bounds[0][1],
        maxX: bounds[1][0],
        maxY: bounds[1][1],
        zipCode: feature.properties.zipCode,
        feature,
      });
    });

    tree.load(items);
    return tree;
  }, [allZctaFeatures, projection]);

  // Build RBush spatial index for zip codes with data
  const { spatialIndex } = useMemo(() => {
    const tree = new RBush<ZipBBox>();
    const path = d3.geoPath(projection);

    const items: ZipBBox[] = [];
    allZctaFeatures.forEach((feature: any) => {
      const zipCode = feature.properties.zipCode;
      if (!dataMap.has(zipCode)) return;

      const bounds = path.bounds(feature);
      if (!bounds || !isFinite(bounds[0][0])) return;

      items.push({
        minX: bounds[0][0],
        minY: bounds[0][1],
        maxX: bounds[1][0],
        maxY: bounds[1][1],
        zipCode,
        feature,
      });
    });

    tree.load(items);
    return { spatialIndex: tree };
  }, [allZctaFeatures, dataMap, projection]);

  useEffect(() => {
    fetch(US_STATES_URL)
      .then((r) => r.json())
      .then(setUsTopology);
  }, []);

  useEffect(() => {
    if (stateFipsList.length === 0) {
      setZctaByState(new Map());
      return;
    }

    Promise.all(
      stateFipsList.map(async (fips) => {
        const topo = await fetchStateZCTA(fips);
        if (!topo) return { fips, features: [] };
        const objName = getObjectName(fips);
        const obj = topo.objects[objName];
        if (!obj) return { fips, features: [] };
        const fc = topojson.feature(topo, obj) as any;
        return {
          fips,
          features: fc.features.map((f: any) => ({
            ...f,
            properties: { ...f.properties, zipCode: f.properties.ZCTA5CE10, stateFips: fips },
          })),
        };
      })
    ).then((results) => {
      const map = new Map<string, any[]>();
      results.forEach((r) => map.set(r.fips, r.features));
      setZctaByState(map);
    });
  }, [stateFipsList]);

  const draw = useCallback(() => {
    if (!canvasRef.current || !usTopology) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    const path = d3.geoPath(projection, ctx);
    const states = topojson.feature(usTopology, usTopology.objects.states) as any;
    const stateMesh = topojson.mesh(usTopology, usTopology.objects.states, (a: any, b: any) => a !== b);
    const nationOutline = topojson.mesh(usTopology, usTopology.objects.states, (a: any, b: any) => a === b);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, width, height);

    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    // Calculate visible viewport in geo coordinates
    const viewMinX = -transform.x / transform.k;
    const viewMinY = -transform.y / transform.k;
    const viewMaxX = (width - transform.x) / transform.k;
    const viewMaxY = (height - transform.y) / transform.k;

    // Draw state fills
    states.features.forEach((feature: any) => {
      ctx.fillStyle = stateFipsList.includes(feature.id) ? '#e8e8e8' : '#f8f8f8';
      ctx.beginPath();
      path(feature);
      ctx.fill();
    });

    // Draw empty zip borders (only visible ones via spatial query)
    if (showEmptyZips) {
      const visibleZips = allZipIndex.search({ minX: viewMinX, minY: viewMinY, maxX: viewMaxX, maxY: viewMaxY });
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 0.5 / transform.k;
      ctx.beginPath();
      visibleZips.forEach((item) => {
        if (!dataMap.has(item.zipCode)) {
          path(item.feature);
        }
      });
      ctx.stroke();
    }

    // Draw zip code fills (only those with data, only visible)
    const visibleDataZips = spatialIndex.search({ minX: viewMinX, minY: viewMinY, maxX: viewMaxX, maxY: viewMaxY });
    visibleDataZips.forEach((item) => {
      const isHovered = item.zipCode === hoveredZip;
      if (isHovered) {
        ctx.fillStyle = '#ffeb3b';
        ctx.strokeStyle = '#f57c00';
        ctx.lineWidth = 2 / transform.k;
        ctx.beginPath();
        path(item.feature);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = colorScale.scale(dataMap.get(item.zipCode)!);
        ctx.beginPath();
        path(item.feature);
        ctx.fill();
      }
    });

    // Draw state borders
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1 / transform.k;
    ctx.beginPath();
    path(stateMesh);
    ctx.stroke();

    // Draw nation outline
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1 / transform.k;
    ctx.beginPath();
    path(nationOutline);
    ctx.stroke();

    ctx.restore();
  }, [usTopology, projection, width, height, dataMap, colorScale, stateFipsList, showEmptyZips, allZipIndex, spatialIndex, transform, hoveredZip]);

  useEffect(() => {
    const frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [draw]);

  // Animate transform to target
  const animateToTransform = useCallback((target: Transform, duration = 750) => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    const start = { ...transform };
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      setTransform({
        x: start.x + (target.x - start.x) * eased,
        y: start.y + (target.y - start.y) * eased,
        k: start.k + (target.k - start.k) * eased,
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [transform]);

  // Find state at canvas point
  const findStateAtPoint = useCallback((canvasX: number, canvasY: number): string | null => {
    if (!usTopology) return null;

    const geoX = (canvasX - transform.x) / transform.k;
    const geoY = (canvasY - transform.y) / transform.k;
    const projected = projection.invert?.([geoX, geoY]);
    if (!projected) return null;

    const states = topojson.feature(usTopology, usTopology.objects.states) as any;
    for (const feature of states.features) {
      if (d3.geoContains(feature, projected)) {
        return feature.id;
      }
    }
    return null;
  }, [usTopology, transform, projection]);

  // Zoom to state
  const zoomToState = useCallback((fips: string) => {
    if (!usTopology) return;

    const states = topojson.feature(usTopology, usTopology.objects.states) as any;
    const stateFeature = states.features.find((s: any) => s.id === fips);
    if (!stateFeature) return;

    const path = d3.geoPath(projection);
    const [[x0, y0], [x1, y1]] = path.bounds(stateFeature);
    const dx = x1 - x0;
    const dy = y1 - y0;
    const x = (x0 + x1) / 2;
    const y = (y0 + y1) / 2;
    const scale = Math.min(10, 0.8 / Math.max(dx / width, dy / height));
    const tx = width / 2 - scale * x;
    const ty = height / 2 - scale * y;

    setActiveState(fips);
    animateToTransform({ x: tx, y: ty, k: scale });
  }, [usTopology, projection, width, height, animateToTransform]);

  const resetZoom = useCallback(() => {
    setActiveState(null);
    animateToTransform({ x: 0, y: 0, k: 1 }, 500);
  }, [animateToTransform]);

  // Zoom to a specific zip code
  const zoomToZip = useCallback((zipCode: string) => {
    const feature = Array.from(spatialIndex.all()).find((item) => item.zipCode === zipCode)?.feature;
    if (!feature) return;

    const path = d3.geoPath(projection);
    const bounds = path.bounds(feature);
    if (!bounds || !isFinite(bounds[0][0])) return;

    const [[x0, y0], [x1, y1]] = bounds;
    const x = (x0 + x1) / 2;
    const y = (y0 + y1) / 2;
    const scale = Math.min(15, 0.15 / Math.max((x1 - x0) / width, (y1 - y0) / height));
    const tx = width / 2 - scale * x;
    const ty = height / 2 - scale * y;

    animateToTransform({ x: tx, y: ty, k: scale });
  }, [spatialIndex, projection, width, height, animateToTransform]);

  // Point-in-polygon test for zip codes
  const findZipAtPoint = useCallback((canvasX: number, canvasY: number): string | null => {
    const geoX = (canvasX - transform.x) / transform.k;
    const geoY = (canvasY - transform.y) / transform.k;

    const candidates = spatialIndex.search({ minX: geoX, minY: geoY, maxX: geoX, maxY: geoY });

    for (const candidate of candidates) {
      const projected = projection.invert?.([geoX, geoY]);
      if (projected && d3.geoContains(candidate.feature, projected)) {
        return candidate.zipCode;
      }
    }
    return null;
  }, [spatialIndex, transform, projection]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newK = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, transform.k * scaleFactor));

    if (newK === transform.k) return;

    const newX = mouseX - (mouseX - transform.x) * (newK / transform.k);
    const newY = mouseY - (mouseY - transform.y) * (newK / transform.k);

    setTransform({ x: newX, y: newY, k: newK });
  }, [transform]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragDistance.current = 0;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setMousePos({ x: e.clientX, y: e.clientY });

    if (isDragging.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      dragDistance.current += Math.abs(dx) + Math.abs(dy);
      lastMouse.current = { x: e.clientX, y: e.clientY };
      setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
      setHoveredZip(null);
    } else {
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      const zip = findZipAtPoint(canvasX, canvasY);
      setHoveredZip(zip);
    }
  }, [findZipAtPoint]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDragging.current = false;
    setHoveredZip(null);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Ignore if this was a drag
    if (dragDistance.current > 5) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // Check for zip click first
    const zip = findZipAtPoint(canvasX, canvasY);
    if (zip) {
      // Zip click - zoom to parent state
      const stateFips = getStateFipsFromZip(zip);
      if (stateFips) {
        if (activeState === stateFips) {
          resetZoom();
        } else {
          zoomToState(stateFips);
        }
      }
      return;
    }

    // Check for state click
    const stateFips = findStateAtPoint(canvasX, canvasY);
    if (stateFips) {
      if (activeState === stateFips) {
        resetZoom();
      } else {
        zoomToState(stateFips);
      }
    }
  }, [findZipAtPoint, findStateAtPoint, activeState, zoomToState, resetZoom]);

  const handleDoubleClick = useCallback(() => {
    resetZoom();
  }, [resetZoom]);

  const zoomIn = () => {
    const newK = Math.min(MAX_ZOOM, transform.k * 1.5);
    const cx = width / 2, cy = height / 2;
    animateToTransform({ x: cx - (cx - transform.x) * (newK / transform.k), y: cy - (cy - transform.y) * (newK / transform.k), k: newK }, 300);
  };

  const zoomOut = () => {
    const newK = Math.max(MIN_ZOOM, transform.k * 0.67);
    const cx = width / 2, cy = height / 2;
    animateToTransform({ x: cx - (cx - transform.x) * (newK / transform.k), y: cy - (cy - transform.y) * (newK / transform.k), k: newK }, 300);
  };

  const isZoomed = transform.k > 1.1;
  const panelWidth = 280;

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      {/* Map container */}
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{
            width,
            height,
            border: '1px solid #ddd',
            borderRadius: 8,
            background: '#fafafa',
            cursor: hoveredZip ? 'pointer' : isZoomed ? 'grab' : 'default',
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        />

        {/* Zoom controls */}
        <div style={{
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
        }}>
          <button onClick={zoomIn} style={btnStyle} title="Zoom In">+</button>
          <button onClick={zoomOut} style={btnStyle} title="Zoom Out">−</button>
          <div style={{ height: 1, background: '#eee', margin: '4px 0' }} />
          <button
            onClick={resetZoom}
            disabled={!isZoomed}
            style={{ ...btnStyle, color: isZoomed ? '#333' : '#aaa', background: isZoomed ? '#fff' : '#f5f5f5' }}
            title="Reset View"
          >⌂</button>
        </div>

        {/* Zoom indicator */}
        {isZoomed && (
          <div style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: 4,
            fontSize: 12,
          }}>
            {Math.round(transform.k * 100)}%
          </div>
        )}

        {/* Tooltip */}
        {hoveredZip && dataMap.has(hoveredZip) && (
          <div style={{
            position: 'fixed',
            left: mousePos.x + 15,
            top: mousePos.y - 10,
            background: 'rgba(0,0,0,0.9)',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: 6,
            fontSize: 14,
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>ZIP {hoveredZip}</div>
            <div style={{ color: '#ccc' }}>
              Value: <span style={{ color: '#fff' }}>{dataMap.get(hoveredZip)?.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Side panel */}
      <div style={{ width: panelWidth, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: height + 60 }}>
        {/* Legend */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          background: '#fff',
          borderRadius: 8,
          border: '1px solid #eee',
        }}>
          <span style={{ fontSize: 13, color: '#666' }}>Low</span>
          <div style={{
            flex: 1,
            height: 14,
            background: `linear-gradient(to right, ${d3.interpolateBlues(0)}, ${d3.interpolateBlues(0.25)}, ${d3.interpolateBlues(0.5)}, ${d3.interpolateBlues(0.75)}, ${d3.interpolateBlues(1)})`,
            borderRadius: 3,
            border: '1px solid #ddd',
          }} />
          <span style={{ fontSize: 13, color: '#666' }}>High</span>
        </div>

        {/* Show empty zips toggle */}
        <label style={{
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
        }}>
          <input
            type="checkbox"
            checked={showEmptyZips}
            onChange={(e) => setShowEmptyZips(e.target.checked)}
          />
          Show empty zip code borders
        </label>

        {/* Table panel - switches between states list and zip codes */}
        <div style={{
          flex: 1,
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {activeState ? (
            <>
              {/* State header */}
              <div style={{ padding: '16px', borderBottom: '1px solid #eee', background: '#f8f8f8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{FIPS_TO_NAME[activeState] || activeState}</h3>
                  <button
                    onClick={resetZoom}
                    style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#666', padding: '4px 8px' }}
                  >×</button>
                </div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{activeStateZips.length} zip codes</span>
                  <span>Total: <strong>{activeStateZips.reduce((sum, z) => sum + z.value, 0).toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Zip codes table header */}
              <div style={{ background: '#f8f8f8', borderBottom: '1px solid #eee' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Zip Code</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Value</th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Zip codes table body */}
              <div style={{ flex: 1, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <tbody>
                    {activeStateZips.map((item, i) => (
                      <tr
                        key={item.zipCode}
                        onMouseEnter={() => setHoveredZip(item.zipCode)}
                        onMouseLeave={() => setHoveredZip(null)}
                        onClick={() => zoomToZip(item.zipCode)}
                        style={{
                          background: hoveredZip === item.zipCode ? '#f0f7ff' : i % 2 === 0 ? '#fff' : '#fafafa',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                      >
                        <td style={{ padding: '10px 12px', borderLeft: `10px solid ${colorScale.scale(item.value)}`, fontFamily: 'monospace' }}>
                          {item.zipCode}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 500 }}>
                          {item.value.toLocaleString()}
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
              <div style={{ padding: '16px', borderBottom: '1px solid #eee', background: '#f8f8f8' }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>States with Data</h3>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{stateSummaries.length} states</span>
                  <span>Total: <strong>{data.reduce((sum, d) => sum + d.value, 0).toLocaleString()}</strong></span>
                </div>
              </div>

              {/* States table header */}
              <div style={{ background: '#f8f8f8', borderBottom: '1px solid #eee' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>State</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* States table body */}
              <div style={{ flex: 1, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <tbody>
                    {stateSummaries.map((state, i) => (
                      <tr
                        key={state.fips}
                        onClick={() => zoomToState(state.fips)}
                        style={{
                          background: i % 2 === 0 ? '#fff' : '#fafafa',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f0f7ff'}
                        onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}
                      >
                        <td style={{ padding: '10px 12px', borderLeft: `10px solid ${stateColorScale.scale(state.total)}` }}>
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
