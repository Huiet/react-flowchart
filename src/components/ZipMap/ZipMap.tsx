import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { ZipMapProps } from './types';
import { getStateFipsFromZip } from '../USHeatMap/stateUtils';
import { fetchStateZCTA, getObjectName } from '../USHeatMap/zctaLoader';
import { createColorScale } from './colorScale';

const US_STATES_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

export function ZipMap({ data, width = 960, height = 600 }: ZipMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const [usTopology, setUsTopology] = useState<any>(null);
  const [zctaByState, setZctaByState] = useState<Map<string, any[]>>(new Map());
  const [tooltip, setTooltip] = useState<{ zip: string; value: number; x: number; y: number } | null>(null);
  const [activeState, setActiveState] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const dataMap = useMemo(() => new Map(data.map(d => [d.zipCode, d.value])), [data]);
  const colorScale = useMemo(() => createColorScale(data.map(d => d.value)), [data]);

  const stateFipsList = useMemo(() => {
    const fips = new Set<string>();
    data.forEach(d => {
      const f = getStateFipsFromZip(d.zipCode);
      if (f) fips.add(f);
    });
    return Array.from(fips);
  }, [data]);

  useEffect(() => {
    fetch(US_STATES_URL).then(r => r.json()).then(setUsTopology);
  }, []);

  useEffect(() => {
    if (stateFipsList.length === 0) {
      setZctaByState(new Map());
      return;
    }

    Promise.all(
      stateFipsList.map(async fips => {
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
            properties: { ...f.properties, zipCode: f.properties.ZCTA5CE10, stateFips: fips }
          }))
        };
      })
    ).then(results => {
      const map = new Map<string, any[]>();
      results.forEach(r => map.set(r.fips, r.features));
      setZctaByState(map);
    });
  }, [stateFipsList]);

  const allZctaFeatures = useMemo(() => {
    const all: any[] = [];
    zctaByState.forEach(features => all.push(...features));
    return all;
  }, [zctaByState]);

  // Zoom controls
  const zoomIn = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy as any, 1.5);
  };

  const zoomOut = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy as any, 0.67);
  };

  const resetZoom = () => {
    if (!svgRef.current || !zoomRef.current) return;
    setActiveState(null);
    d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform as any, d3.zoomIdentity);
  };

  // Zoom to state
  const zoomToState = (stateFeature: any, fips: string) => {
    if (!svgRef.current || !zoomRef.current || !gRef.current) return;

    const projection = d3.geoAlbersUsa().scale(1300).translate([width / 2, height / 2]);
    const path = d3.geoPath(projection);

    if (activeState === fips) {
      resetZoom();
      return;
    }

    setActiveState(fips);

    const [[x0, y0], [x1, y1]] = path.bounds(stateFeature);
    const dx = x1 - x0;
    const dy = y1 - y0;
    const x = (x0 + x1) / 2;
    const y = (y0 + y1) / 2;
    const scale = Math.min(10, 0.8 / Math.max(dx / width, dy / height));
    const tx = width / 2 - scale * x;
    const ty = height / 2 - scale * y;

    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(zoomRef.current.transform as any, d3.zoomIdentity.translate(tx, ty).scale(scale));
  };

  useEffect(() => {
    if (!svgRef.current || !usTopology) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');
    gRef.current = g;

    const projection = d3.geoAlbersUsa().scale(1300).translate([width / 2, height / 2]);
    const path = d3.geoPath(projection);

    const states = topojson.feature(usTopology, usTopology.objects.states) as any;
    const stateMesh = topojson.mesh(usTopology, usTopology.objects.states, (a: any, b: any) => a !== b);

    // State fills
    g.append('g')
      .attr('class', 'states')
      .selectAll('path')
      .data(states.features)
      .join('path')
      .attr('d', path as any)
      .attr('fill', (d: any) => stateFipsList.includes(d.id) ? '#e8e8e8' : '#f8f8f8')
      .attr('stroke', 'none')
      .style('cursor', 'pointer')
      .on('mouseenter', function(_, d: any) {
        d3.select(this).attr('fill', stateFipsList.includes(d.id) ? '#ddd' : '#f0f0f0');
      })
      .on('mouseleave', function(_, d: any) {
        d3.select(this).attr('fill', stateFipsList.includes(d.id) ? '#e8e8e8' : '#f8f8f8');
      })
      .on('click', function(event: MouseEvent, d: any) {
        event.stopPropagation();
        zoomToState(d, d.id);
      });

    // ZCTA zip codes - pointer-events only for hover tooltip, clicks pass through
    g.append('g')
      .attr('class', 'zcta')
      .selectAll('path')
      .data(allZctaFeatures)
      .join('path')
      .attr('d', path as any)
      .attr('fill', (d: any) => {
        const val = dataMap.get(d.properties.zipCode);
        return val !== undefined ? colorScale.scale(val) : 'transparent';
      })
      .attr('stroke', 'none')
      .attr('opacity', 0.9)
      .style('pointer-events', 'none'); // Let clicks pass through to states

    // Invisible overlay for zip code tooltips only
    g.append('g')
      .attr('class', 'zcta-overlay')
      .selectAll('path')
      .data(allZctaFeatures.filter((d: any) => dataMap.has(d.properties.zipCode)))
      .join('path')
      .attr('d', path as any)
      .attr('fill', 'transparent')
      .attr('stroke', 'transparent')
      .style('cursor', 'pointer')
      .on('mouseenter', function(event: MouseEvent, d: any) {
        const zip = d.properties.zipCode;
        const val = dataMap.get(zip);
        if (val !== undefined) {
          // Scale up the actual zip code path
          const zipPath = g.select('.zcta')
            .selectAll('path')
            .filter((z: any) => z.properties.zipCode === zip);
          
          // Get centroid for transform origin
          const bounds = (zipPath.node() as SVGPathElement)?.getBBox();
          if (bounds) {
            const cx = bounds.x + bounds.width / 2;
            const cy = bounds.y + bounds.height / 2;
            zipPath
              .attr('transform', `translate(${cx}, ${cy}) scale(1.5) translate(${-cx}, ${-cy})`)
              .attr('opacity', 1)
              .raise();
          }
          setTooltip({ zip, value: val, x: event.clientX, y: event.clientY });
        }
      })
      .on('mousemove', (event: MouseEvent) => {
        setTooltip(t => t ? { ...t, x: event.clientX, y: event.clientY } : null);
      })
      .on('mouseleave', function(_, d: any) {
        const zip = d.properties.zipCode;
        g.select('.zcta')
          .selectAll('path')
          .filter((z: any) => z.properties.zipCode === zip)
          .attr('transform', null)
          .attr('opacity', 0.9);
        setTooltip(null);
      })
      .on('click', function(event: MouseEvent, d: any) {
        event.stopPropagation();
        const stateFips = d.properties.stateFips;
        const stateFeature = states.features.find((s: any) => s.id === stateFips);
        if (stateFeature) {
          zoomToState(stateFeature, stateFips);
        }
      });

    // State borders
    g.append('path')
      .datum(stateMesh)
      .attr('d', path as any)
      .attr('fill', 'none')
      .attr('stroke', '#666')
      .attr('stroke-width', 1)
      .attr('pointer-events', 'none');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 25])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    zoomRef.current = zoom;
    svg.call(zoom);
    svg.on('dblclick.zoom', null);
    svg.on('dblclick', () => resetZoom());

  }, [usTopology, allZctaFeatures, dataMap, colorScale, width, height, stateFipsList]);

  const isZoomed = zoomLevel > 1.1;

  return (
    <div style={{ position: 'relative' }}>
      {/* Map */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ 
          border: '1px solid #ddd', 
          borderRadius: 8,
          cursor: isZoomed ? 'grab' : 'default',
          background: '#fafafa',
        }}
      />
      
      {/* Controls */}
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
        <button
          onClick={zoomIn}
          style={{
            width: 36,
            height: 36,
            border: '1px solid #ddd',
            borderRadius: 6,
            background: '#fff',
            cursor: 'pointer',
            fontSize: 20,
            fontWeight: 'bold',
            color: '#333',
          }}
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          style={{
            width: 36,
            height: 36,
            border: '1px solid #ddd',
            borderRadius: 6,
            background: '#fff',
            cursor: 'pointer',
            fontSize: 20,
            fontWeight: 'bold',
            color: '#333',
          }}
          title="Zoom Out"
        >
          −
        </button>
        <div style={{ height: 1, background: '#eee', margin: '4px 0' }} />
        <button
          onClick={resetZoom}
          disabled={!isZoomed}
          style={{
            width: 36,
            height: 36,
            border: '1px solid #ddd',
            borderRadius: 6,
            background: isZoomed ? '#fff' : '#f5f5f5',
            cursor: isZoomed ? 'pointer' : 'default',
            fontSize: 14,
            color: isZoomed ? '#333' : '#aaa',
          }}
          title="Reset View"
        >
          ⌂
        </button>
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
          {Math.round(zoomLevel * 100)}%
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
          <div style={{ fontWeight: 600, marginBottom: 4 }}>ZIP {tooltip.zip}</div>
          <div style={{ color: '#ccc' }}>Value: <span style={{ color: '#fff' }}>{tooltip.value.toLocaleString()}</span></div>
        </div>
      )}

      {/* Legend */}
      <div style={{ 
        marginTop: 16, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12,
        padding: '12px 16px',
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #eee',
        width: 'fit-content',
      }}>
        <span style={{ fontSize: 13, color: '#666' }}>Low</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{colorScale.min.toLocaleString()}</span>
        <div
          style={{
            width: 180,
            height: 14,
            background: `linear-gradient(to right, ${d3.interpolateBlues(0)}, ${d3.interpolateBlues(0.25)}, ${d3.interpolateBlues(0.5)}, ${d3.interpolateBlues(0.75)}, ${d3.interpolateBlues(1)})`,
            borderRadius: 3,
            border: '1px solid #ddd',
          }}
        />
        <span style={{ fontSize: 14, fontWeight: 500 }}>{colorScale.max.toLocaleString()}</span>
        <span style={{ fontSize: 13, color: '#666' }}>High</span>
      </div>
    </div>
  );
}
