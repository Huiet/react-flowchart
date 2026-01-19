import { ZipMapWebGL } from './components/ZipMapWebGL';
import { sharedZipMapData } from './shared/zipMapData';

export function ZipMapWebGLDemo() {
  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 16 }}>WebGL Zip Code Map (High Performance)</h1>

      <ZipMapWebGL data={sharedZipMapData} width={1000} height={650} />

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
        <strong>Features:</strong> Automatic LOD switching • 3-digit consolidation at low zoom •
        5-digit detail at high zoom • WebGL rendering for maximum performance
      </div>
    </div>
  );
}
