import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { HeatMapProps, TooltipData } from '../types';
import { createColorScale } from '../colorScale';
import { Tooltip } from '../Tooltip';
import { fetchStateZCTA, getObjectName } from '../zctaLoader';
import { getStateFipsFromZip } from '../stateUtils';
import styles from './ZipCodeMap.module.css';

// Pre-projected US states (AlbersUSA)
const US_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json';
const MAP_WIDTH = 975;
const MAP_HEIGHT = 610;

export const ZipCodeMap: React.FC<HeatMapProps> = ({
  data,
  width: propWidth,
  height: propHeight,
  onSelect,
  selectedZip,
  valueFormatter = (v) => v.toLocaleString(),
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: propWidth || 975, height: propHeight || 610 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [topology, setTopology] = useState<any>(null);
  const [zctaFeatures, setZctaFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load US base map
  useEffect(() => {
    fetch(US_ATLAS_URL).then(res => res.json()).then(setTopology);
  }, []);

  // Load ZCTA data for states with data
  useEffect(() => {
    const stateFips = new Set<string>();
    data.forEach(d => {
      const fips = getStateFipsFromZip(d.zipCode);
      if (fips) stateFips.add(fips);
    });

    if (stateFips.size === 0) {
      setZctaFeatures([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(
      Array.from(stateFips).map(async fips => {
        const topo = await fetchStateZCTA(fips);
        if (!topo) return [];
        const objName = getObjectName(fips);
        const obj = topo.objects[objName];
        if (!obj) return [];
        const fc = topojson.feature(topo, obj) as any;
        return fc.features.map((f: any) => ({
          ...f,
          properties: { ...f.properties, zipCode: f.properties.ZCTA5CE10 }
        }));
      })
    ).then(results => {
      setZctaFeatures(results.flat());
      setLoading(false);
    });
  }, [data]);

  useEffect(() => {
    if (!containerRef.current || propWidth || propHeight) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width && height) setDimensions({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [propWidth, propHeight]);

  const { width, height } = dimensions;
  const dataMap = useMemo(() => new Map(data.map(d => [d.zipCode, d.value])), [data]);
  const colorScale = useMemo(() => createColorScale(data.map(d => d.value)), [data]);
  
  // Projection for ZCTA data (unprojected lat/lon -> screen)
  const projection = useMemo(() => d3.geoAlbersUsa().scale(1300).translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]), []);
  
  // Path for pre-projected atlas (no projection needed)
  const pathAtlas = useMemo(() => d3.geoPath(), []);
  // Path for ZCTA (needs projection)
  const pathZcta = useMemo(() => d3.geoPath(projection), [projection]);

  // Render everything
  useEffect(() => {
    if (!svgRef.current || !topology) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    const states = topojson.feature(topology, topology.objects.states) as any;
    const stateMesh = topojson.mesh(topology, topology.objects.states, (a: any, b: any) => a !== b);

    // State backgrounds (pre-projected)
    g.append('g')
      .attr('class', 'states')
      .selectAll('path')
      .data(states.features)
      .join('path')
      .attr('d', pathAtlas as any)
      .attr('fill', '#f0f0f0')
      .attr('stroke', 'none');

    // ZCTA features (needs projection)
    g.append('g')
      .attr('class', 'zcta')
      .selectAll('path')
      .data(zctaFeatures)
      .join('path')
      .attr('d', pathZcta as any)
      .attr('fill', (d: any) => {
        const value = dataMap.get(d.properties.zipCode);
        return value !== undefined ? colorScale.scale(value) : '#ddd';
      })
      .attr('stroke', (d: any) => d.properties.zipCode === selectedZip ? '#000' : '#fff')
      .attr('stroke-width', (d: any) => d.properties.zipCode === selectedZip ? 2 : 0.5)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event: MouseEvent, d: any) {
        d3.select(this).attr('stroke', '#333').attr('stroke-width', 1.5);
        const zip = d.properties.zipCode;
        setTooltip({ zipCode: zip, value: dataMap.get(zip), x: event.clientX, y: event.clientY });
      })
      .on('mousemove', (event: MouseEvent) => {
        setTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null);
      })
      .on('mouseleave', function(_, d: any) {
        const isSelected = d.properties.zipCode === selectedZip;
        d3.select(this).attr('stroke', isSelected ? '#000' : '#fff').attr('stroke-width', isSelected ? 2 : 0.5);
        setTooltip(null);
      })
      .on('click', function(event: MouseEvent, d: any) {
        event.stopPropagation();
        const zip = d.properties.zipCode;
        onSelect?.(selectedZip === zip ? null : zip);
      });

    // State borders on top (pre-projected)
    g.append('path')
      .datum(stateMesh)
      .attr('d', pathAtlas as any)
      .attr('fill', 'none')
      .attr('stroke', '#999')
      .attr('stroke-width', 1)
      .attr('pointer-events', 'none');

    // Zoom
    const initialScale = Math.min(width / MAP_WIDTH, height / MAP_HEIGHT);
    const tx = (width - MAP_WIDTH * initialScale) / 2;
    const ty = (height - MAP_HEIGHT * initialScale) / 2;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([initialScale * 0.5, 8])
      .on('zoom', event => g.attr('transform', event.transform));

    svg.call(zoom);
    svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(initialScale));

  }, [topology, zctaFeatures, dataMap, colorScale, selectedZip, width, height, pathAtlas, pathZcta, onSelect]);

  return (
    <div ref={containerRef} className={styles.container} style={{ width: propWidth, height: propHeight }}>
      <svg ref={svgRef} width={width} height={height} className={styles.map} />
      {loading && zctaFeatures.length === 0 && <div className={styles.loading}>Loading zip codes...</div>}
      {tooltip && <Tooltip data={tooltip} valueFormatter={valueFormatter} />}
    </div>
  );
};
