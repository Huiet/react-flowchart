import { ZipMapDocumentation } from './components/ZipMap/Documentation';
import { ZipMap } from './components/ZipMap/ZipMap';
import { sharedZipMapData } from './shared/zipMapData';

export function ZipMapDemo() {
  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 16 }}>US Zip Code Map</h1>

      <ZipMap data={sharedZipMapData} width={1000} height={650} />

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
        <strong>Tips:</strong> Click a state to zoom in • Click again to reset • Scroll to zoom •
        Drag to pan • Hover zip codes for details
      </div>

      <ZipMapDocumentation />
    </div>
  );
}
