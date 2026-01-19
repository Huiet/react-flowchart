import { useMemo } from 'react';
import { ZipMapDocumentation } from './components/ZipMap/Documentation';
import { ZipDataPoint } from './components/ZipMap/types';
import { ZipMap } from './components/ZipMap/ZipMap';

// Real zip codes from the TopoJSON files
const REAL_ZIPS: Record<string, string[]> = {
  CA: [
    // Bay Area cluster
    '94601',
    '94501',
    '94560',
    '94587',
    '94580',
    '94514',
    '94703',
    '94549',
    '94595',
    '94506',
    '94806',
    '94801',
    '94803',
    '94553',
    '94530',
    '94572',
    // LA area cluster
    '91504',
    '91606',
    '90640',
    '91770',
    '90290',
    '91792',
    '91789',
    '91791',
    '91723',
    '91773',
    '91702',
    '91741',
    '91765',
    '90303',
    '90033',
    '90032',
    '90249',
    '90822',
    '91355',
    '91350',
    '91387',
    '91001',
    '91604',
    '91402',
    '91030',
    // Central Valley
    '93608',
    '93612',
    '93630',
    '93606',
    '93646',
    '93664',
    '93703',
    '93234',
    '93616',
    // Bakersfield area
    '93305',
    '93308',
    '93311',
    '93220',
    '93518',
    '93251',
    '93226',
    '93245',
    '93266',
  ],
  NY: [
    // NYC area
    '10464',
    '10470',
    '10455',
    '10473',
    // Buffalo area
    '14227',
    '14127',
    '14218',
    '14034',
    '14219',
    '14080',
    '14145',
    '14061',
    '14020',
    '14125',
    '14143',
    '14422',
    // Hudson Valley
    '12524',
    '12601',
    '12603',
    '12540',
    '12533',
    '12531',
    '12538',
    '12580',
    '12205',
    '12009',
    '12502',
    '12075',
    '12529',
    '12132',
    '12017',
    // Upstate
    '13797',
    '13118',
    '13073',
    '13074',
    '13159',
    '13784',
    '13782',
    '13842',
    '13739',
    '13860',
    '13436',
    '13331',
    '13340',
    '13637',
    '13673',
    '13640',
    // Western NY
    '14804',
    '14836',
    '14536',
    '14719',
    '14048',
    '14781',
    '14757',
    '14733',
    '14769',
    '14756',
    '14864',
  ],
  TX: [
    // San Antonio area
    '78216',
    '78232',
    '78244',
    '78204',
    '78224',
    '78234',
    '78006',
    '78011',
    '78114',
    '78052',
    // Austin area
    '78669',
    '78643',
    '78650',
    '78656',
    '78655',
    // Dallas/Plano area
    '75024',
    '75252',
    '75071',
    '75409',
    '75034',
    '75035',
    '75070',
    '75248',
    '75164',
    '75040',
    '75246',
    '75243',
    '75042',
    '75172',
    '75216',
    '75115',
    '75801',
    '75839',
    // Houston area
    '77578',
    '77430',
    '77808',
    '77982',
    '77665',
    '77575',
    '77475',
    // West Texas
    '79601',
    '79527',
    '79517',
    '79045',
    '79314',
    '79248',
    '79252',
    '79766',
    '79235',
    '79371',
    // Other
    '78336',
    '78387',
    '78125',
    '78353',
    '78578',
    '78569',
    '76389',
    '76310',
    '76542',
    '76544',
    '76501',
    '76519',
    '76569',
    '76508',
    '76671',
    '76665',
    '76432',
    '76567',
    '76454',
    '76252',
    '76239',
    '76234',
    '76273',
    '76561',
    '76873',
  ],
};

function generateData(zips: string[], baseValue: number, variance: number): ZipDataPoint[] {
  return zips.map((zipCode) => ({
    zipCode,
    value: Math.floor(baseValue + Math.random() * variance),
  }));
}

export function ZipMapDemo() {
  const data = useMemo(
    () => [
      ...generateData(REAL_ZIPS.CA, 2000, 8000),
      ...generateData(REAL_ZIPS.NY, 1500, 6000),
      ...generateData(REAL_ZIPS.TX, 3000, 7000),
    ],
    []
  );

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 16 }}>US Zip Code Map</h1>

      <ZipMap data={data} width={1000} height={650} />

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
