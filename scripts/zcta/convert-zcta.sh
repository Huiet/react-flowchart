#!/bin/bash

# Convert State Zip Code GeoJSON to TopoJSON and upload to S3
# Source: https://github.com/OpenDataDE/State-zip-code-GeoJSON

S3_BUCKET="state-zipcode-geo-data"
S3_PREFIX="zcta"
WORK_DIR="../../public/zcta"
SIMPLIFY_PERCENT="10%"
BASE_URL="https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master"

# State name:FIPS pairs
STATES="
al_alabama:01
ak_alaska:02
az_arizona:04
ar_arkansas:05
ca_california:06
co_colorado:08
ct_connecticut:09
de_delaware:10
dc_district_of_columbia:11
fl_florida:12
ga_georgia:13
hi_hawaii:15
id_idaho:16
il_illinois:17
in_indiana:18
ia_iowa:19
ks_kansas:20
ky_kentucky:21
la_louisiana:22
me_maine:23
md_maryland:24
ma_massachusetts:25
mi_michigan:26
mn_minnesota:27
ms_mississippi:28
mo_missouri:29
mt_montana:30
ne_nebraska:31
nv_nevada:32
nh_new_hampshire:33
nj_new_jersey:34
nm_new_mexico:35
ny_new_york:36
nc_north_carolina:37
nd_north_dakota:38
oh_ohio:39
ok_oklahoma:40
or_oregon:41
pa_pennsylvania:42
ri_rhode_island:44
sc_south_carolina:45
sd_south_dakota:46
tn_tennessee:47
tx_texas:48
ut_utah:49
vt_vermont:50
va_virginia:51
wa_washington:53
wv_west_virginia:54
wi_wisconsin:55
wy_wyoming:56
pr_puerto_rico:72
"

mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

echo "=== State Zip Code GeoJSON to TopoJSON Conversion ==="

for ENTRY in $STATES; do
  STATE=$(echo "$ENTRY" | cut -d: -f1)
  FIPS=$(echo "$ENTRY" | cut -d: -f2)
  
  [ -z "$STATE" ] && continue
  
  GEOJSON_FILE="${STATE}_zip_codes_geo.min.json"
  OUTPUT_FILE="${FIPS}.topojson"
  URL="${BASE_URL}/${GEOJSON_FILE}"
  
  echo "Processing: $STATE (FIPS: $FIPS)"
  
  # Skip if already uploaded
  if aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/${OUTPUT_FILE}" &>/dev/null; then
    echo "  ✓ Already exists in S3, skipping"
    continue
  fi
  
  # Download
  curl -sL -o "$GEOJSON_FILE" "$URL"
  if [ ! -s "$GEOJSON_FILE" ]; then
    echo "  ✗ Download failed"
    rm -f "$GEOJSON_FILE"
    continue
  fi
  
  # Convert
  mapshaper "$GEOJSON_FILE" -simplify "$SIMPLIFY_PERCENT" keep-shapes -o format=topojson "$OUTPUT_FILE" 2>/dev/null
  
  if [ ! -f "$OUTPUT_FILE" ]; then
    echo "  ✗ Conversion failed"
    rm -f "$GEOJSON_FILE"
    continue
  fi
  
  SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
  
  # Upload
  aws s3 cp "$OUTPUT_FILE" "s3://${S3_BUCKET}/${S3_PREFIX}/${OUTPUT_FILE}" --content-type "application/json" --quiet
  
  if [ $? -eq 0 ]; then
    echo "  ✓ Uploaded ($SIZE)"
  else
    echo "  ✗ Upload failed"
  fi
  
  rm -f "$GEOJSON_FILE" "$OUTPUT_FILE"
done

echo "=== Complete ==="
