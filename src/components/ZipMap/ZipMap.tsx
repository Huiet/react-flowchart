import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { ZipMapProps } from './types';
import { getStateFipsFromZip, STATE_FIPS } from './stateUtils';
import { fetchStateZCTA, getObjectName } from './zctaLoader';
import { createColorScale } from './colorScale';

const US_STATES_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// FIPS to state name
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

export function ZipMap({ data, width = 960, height = 600 }: ZipMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const [usTopology, setUsTopology] = useState<any>(null);
  const [zctaByState, setZctaByState] = useState<Map<string, any[]>>(new Map());
  const [tooltip, setTooltip] = useState<{ zip: string; value: number; x: number; y: number } | null>(null);
  const [activeState, setActiveState] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredZip, setHoveredZip] = useState<string | null>(null);

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

  // Get sorted zip codes for active state
  const activeStateZips = useMemo(() => {
    if (!activeState) return [];
    return data
      .filter(d => getStateFipsFromZip(d.zipCode) === activeState)
      .sort((a, b) => b.value - a.value);
  }, [activeState, data]);

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

  // Zoom to a specific zip code
  const zoomToZip = (zipCode: string) => {
    if (!svgRef.current || !zoomRef.current || !gRef.current) return;

    const zipPath = gRef.current.select('.zcta')
      .selectAll('path')
      .filter((d: any) => d.properties.zipCode === zipCode);
    
    const node = zipPath.node() as SVGPathElement;
    if (!node) return;

    const bounds = node.getBBox();
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height / 2;
    // Scale to show zip taking ~1/6 of view
    const scale = Math.min(15, 0.15 / Math.max(bounds.width / width, bounds.height / height));
    const tx = width / 2 - scale * x;
    const ty = height / 2 - scale * y;

    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(zoomRef.current.transform as any, d3.zoomIdentity.translate(tx, ty).scale(scale));
  };

  // Highlight zip on map when hovered from table
  useEffect(() => {
    if (!gRef.current) return;
    
    const g = gRef.current;
    
    // Reset all transforms first
    g.select('.zcta').selectAll('path').attr('transform', null).attr('opacity', 0.9);
    
    if (hoveredZip) {
      const zipPath = g.select('.zcta')
        .selectAll('path')
        .filter((d: any) => d.properties.zipCode === hoveredZip);
      
      const node = zipPath.node() as SVGPathElement;
      if (node) {
        const bounds = node.getBBox();
        const cx = bounds.x + bounds.width / 2;
        const cy = bounds.y + bounds.height / 2;
        zipPath
          .attr('transform', `translate(${cx}, ${cy}) scale(1.5) translate(${-cx}, ${-cy})`)
          .attr('opacity', 1)
          .raise();
      }
    }
  }, [hoveredZip]);

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
      .style('pointer-events', 'none');

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
          setHoveredZip(zip);
          setTooltip({ zip, value: val, x: event.clientX, y: event.clientY });
        }
      })
      .on('mousemove', (event: MouseEvent) => {
        setTooltip(t => t ? { ...t, x: event.clientX, y: event.clientY } : null);
      })
      .on('mouseleave', function() {
        setHoveredZip(null);
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

    g.append('path')
      .datum(stateMesh)
      .attr('d', path as any)
      .attr('fill', 'none')
      .attr('stroke', '#666')
      .attr('stroke-width', 1)
      .attr('pointer-events', 'none');

    const nationOutline = topojson.mesh(usTopology, usTopology.objects.states, (a: any, b: any) => a === b);
    g.append('path')
      .datum(nationOutline)
      .attr('d', path as any)
      .attr('fill', 'none')
      .attr('stroke', '#333')
      .attr('stroke-width', 1.5)
      .attr('pointer-events', 'none');

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
  const panelWidth = 280;

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      {/* Map container */}
      <div style={{ position: 'relative' }}>
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
            {Math.round(zoomLevel * 100)}%
          </div>
        )}

        {/* Tooltip */}
        {tooltip && (
          <div style={{
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
          }}>
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
          <div style={{
            width: 180,
            height: 14,
            background: `linear-gradient(to right, ${d3.interpolateBlues(0)}, ${d3.interpolateBlues(0.25)}, ${d3.interpolateBlues(0.5)}, ${d3.interpolateBlues(0.75)}, ${d3.interpolateBlues(1)})`,
            borderRadius: 3,
            border: '1px solid #ddd',
          }} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>{colorScale.max.toLocaleString()}</span>
          <span style={{ fontSize: 13, color: '#666' }}>High</span>
        </div>
      </div>

      {/* Side panel - shows when state is selected */}
      {activeState && (
        <div style={{
          width: panelWidth,
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: height,
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #eee',
            background: '#f8f8f8',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>{FIPS_TO_NAME[activeState] || activeState}</h3>
              <button
                onClick={resetZoom}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 18,
                  cursor: 'pointer',
                  color: '#666',
                  padding: '4px 8px',
                }}
              >×</button>
            </div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
              {activeStateZips.length} zip codes
            </div>
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8f8f8', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Zip Code</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {activeStateZips.map((item, i) => (
                  <tr
                    key={item.zipCode}
                    onMouseEnter={() => setHoveredZip(item.zipCode)}
                    onMouseLeave={() => setHoveredZip(null)}
                    onClick={() => zoomToZip(item.zipCode)}
                    style={{
                      background: hoveredZip === item.zipCode ? '#f0f7ff' : (i % 2 === 0 ? '#fff' : '#fafafa'),
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{
                      padding: '10px 12px',
                      borderLeft: `10px solid ${colorScale.scale(item.value)}`,
                      fontFamily: 'monospace',
                    }}>
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
        </div>
      )}
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
