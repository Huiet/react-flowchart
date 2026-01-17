import { useState, useMemo } from 'react';
import { Container, Title, Paper, Group, Text, SegmentedControl, Stack, Badge } from '@mantine/core';
import { ZipCodeMap, Legend, createColorScale } from './components/USHeatMap';
import { generateCAData, generateNYData, generateTXData, generateMultiStateData } from './components/USHeatMap/zctaLoader';
import { getStatesFromZipData } from './components/USHeatMap/stateUtils';

type DataSet = 'ca' | 'ny' | 'tx' | 'multi';

const DATA_SETS: Record<DataSet, { label: string; generator: () => any[] }> = {
  ca: { label: 'California', generator: generateCAData },
  ny: { label: 'New York', generator: generateNYData },
  tx: { label: 'Texas', generator: generateTXData },
  multi: { label: 'CA + NY + TX', generator: generateMultiStateData },
};

export function USHeatMapDemo() {
  const [selectedZip, setSelectedZip] = useState<string | null>(null);
  const [dataSet, setDataSet] = useState<DataSet>('ca');

  const data = useMemo(() => DATA_SETS[dataSet].generator(), [dataSet]);
  const colorScale = useMemo(() => createColorScale(data.map((d) => d.value)), [data]);

  const detectedStates = useMemo(() => {
    return getStatesFromZipData(data.map(d => d.zipCode));
  }, [data]);

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="lg">US Heat Map</Title>

      <Stack gap="md" mb="md">
        <Group>
          <Text size="sm" fw={500}>Data:</Text>
          <SegmentedControl
            value={dataSet}
            onChange={(v) => {
              setDataSet(v as DataSet);
              setSelectedZip(null);
            }}
            data={Object.entries(DATA_SETS).map(([value, { label }]) => ({ value, label }))}
          />
        </Group>

        {detectedStates.length > 0 && (
          <Group gap="xs">
            <Text size="sm" c="dimmed">States:</Text>
            {detectedStates.map(state => (
              <Badge key={state} variant="light" size="sm">{state}</Badge>
            ))}
          </Group>
        )}
      </Stack>

      <Paper shadow="sm" p="md" withBorder>
        <div style={{ height: 500 }}>
          <ZipCodeMap
            data={data}
            onSelect={setSelectedZip}
            selectedZip={selectedZip}
          />
        </div>
        <Legend thresholds={colorScale.thresholds} />
      </Paper>

      <Stack mt="md" gap="xs">
        <Text size="sm" c="dimmed">
          Click a zip code to select. Scroll to zoom, drag to pan.
        </Text>
        {selectedZip && (
          <Paper p="sm" withBorder>
            <Text fw={600}>Zip: {selectedZip}</Text>
            <Text>Value: {data.find(d => d.zipCode === selectedZip)?.value?.toLocaleString() || 'N/A'}</Text>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
