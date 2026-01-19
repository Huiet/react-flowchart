import { useState } from 'react';
import { USZipCodeMap } from './components/USZipCodeMap/USZipCodeMap';

export function USZipCodeMapDemo() {
  const [data] = useState(() => {
    // Generate sample data for a few zip codes
    const sampleZips = [
      '90210',
      '90001',
      '94102', // CA
      '10001',
      '10011',
      '11201', // NY
      '75201',
      '77001',
      '78701', // TX
    ];
    return sampleZips.map((zip) => ({
      zipCode: zip,
      value: Math.floor(Math.random() * 10000) + 500,
    }));
  });

  return (
    <div style={{ padding: '20px' }}>
      <h1>US Zip Code Heat Map</h1>
      <USZipCodeMap data={data} width={960} height={600} />
    </div>
  );
}
