import { ZipDataPoint } from './types';

// State FIPS to object name mapping (from OpenDataDE naming convention)
const STATE_OBJECT_NAMES: Record<string, string> = {
  '01': 'al_alabama_zip_codes_geo.min',
  '02': 'ak_alaska_zip_codes_geo.min',
  '04': 'az_arizona_zip_codes_geo.min',
  '05': 'ar_arkansas_zip_codes_geo.min',
  '06': 'ca_california_zip_codes_geo.min',
  '08': 'co_colorado_zip_codes_geo.min',
  '09': 'ct_connecticut_zip_codes_geo.min',
  '10': 'de_delaware_zip_codes_geo.min',
  '11': 'dc_district_of_columbia_zip_codes_geo.min',
  '12': 'fl_florida_zip_codes_geo.min',
  '13': 'ga_georgia_zip_codes_geo.min',
  '15': 'hi_hawaii_zip_codes_geo.min',
  '16': 'id_idaho_zip_codes_geo.min',
  '17': 'il_illinois_zip_codes_geo.min',
  '18': 'in_indiana_zip_codes_geo.min',
  '19': 'ia_iowa_zip_codes_geo.min',
  '20': 'ks_kansas_zip_codes_geo.min',
  '21': 'ky_kentucky_zip_codes_geo.min',
  '22': 'la_louisiana_zip_codes_geo.min',
  '23': 'me_maine_zip_codes_geo.min',
  '24': 'md_maryland_zip_codes_geo.min',
  '25': 'ma_massachusetts_zip_codes_geo.min',
  '26': 'mi_michigan_zip_codes_geo.min',
  '27': 'mn_minnesota_zip_codes_geo.min',
  '28': 'ms_mississippi_zip_codes_geo.min',
  '29': 'mo_missouri_zip_codes_geo.min',
  '30': 'mt_montana_zip_codes_geo.min',
  '31': 'ne_nebraska_zip_codes_geo.min',
  '32': 'nv_nevada_zip_codes_geo.min',
  '33': 'nh_new_hampshire_zip_codes_geo.min',
  '34': 'nj_new_jersey_zip_codes_geo.min',
  '35': 'nm_new_mexico_zip_codes_geo.min',
  '36': 'ny_new_york_zip_codes_geo.min',
  '37': 'nc_north_carolina_zip_codes_geo.min',
  '38': 'nd_north_dakota_zip_codes_geo.min',
  '39': 'oh_ohio_zip_codes_geo.min',
  '40': 'ok_oklahoma_zip_codes_geo.min',
  '41': 'or_oregon_zip_codes_geo.min',
  '42': 'pa_pennsylvania_zip_codes_geo.min',
  '44': 'ri_rhode_island_zip_codes_geo.min',
  '45': 'sc_south_carolina_zip_codes_geo.min',
  '46': 'sd_south_dakota_zip_codes_geo.min',
  '47': 'tn_tennessee_zip_codes_geo.min',
  '48': 'tx_texas_zip_codes_geo.min',
  '49': 'ut_utah_zip_codes_geo.min',
  '50': 'vt_vermont_zip_codes_geo.min',
  '51': 'va_virginia_zip_codes_geo.min',
  '53': 'wa_washington_zip_codes_geo.min',
  '54': 'wv_west_virginia_zip_codes_geo.min',
  '55': 'wi_wisconsin_zip_codes_geo.min',
  '56': 'wy_wyoming_zip_codes_geo.min',
};

export function getObjectName(stateFips: string): string {
  return STATE_OBJECT_NAMES[stateFips] || `state_${stateFips}_zip_codes_geo.min`;
}

export async function fetchStateZCTA(stateFips: string): Promise<any> {
  const url = `/zcta/${stateFips}.topojson`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchStatesZCTA(stateFipsList: string[]): Promise<any[]> {
  const results = await Promise.all(stateFipsList.map(fetchStateZCTA));
  return results.filter(Boolean);
}

// Sample data generators
export function generateCAData(): ZipDataPoint[] {
  const zips = ['90001','90002','90003','90210','94102','94103','94110','94114'];
  return zips.map(zip => ({ zipCode: zip, value: Math.floor(Math.random() * 10000) + 500 }));
}

export function generateNYData(): ZipDataPoint[] {
  const zips = ['10001','10002','10003','10011','10012','11201','11211','11215'];
  return zips.map(zip => ({ zipCode: zip, value: Math.floor(Math.random() * 15000) + 1000 }));
}

export function generateTXData(): ZipDataPoint[] {
  const zips = ['75001','75201','77001','77002','77003','77019','78201','78701'];
  return zips.map(zip => ({ zipCode: zip, value: Math.floor(Math.random() * 8000) + 200 }));
}

export function generateMultiStateData(): ZipDataPoint[] {
  return [...generateCAData(), ...generateNYData(), ...generateTXData()];
}
