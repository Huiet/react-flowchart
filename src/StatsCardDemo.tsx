import { Container, Title, Text, SimpleGrid, Stack, Paper, Code } from '@mantine/core';
import { IconUsers, IconCrown, IconTrophy, IconChecks, IconInfoCircle } from '@tabler/icons-react';
import { StatsCard } from './components/StatsCard';

export function StatsCardDemo() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="xs">
            StatsCard Component Demo
          </Title>
          <Text c="dimmed">
            Highly atomic, reusable card components built with Mantine and Tabler Icons
          </Text>
        </div>

        {/* Example from your image */}
        <section>
          <Title order={2} size="h3" mb="md">
            Dashboard Example
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            Recreating the cards from your reference image
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
            <StatsCard
              label="Total Users"
              value="12,847"
              trend={{ value: 8.2, type: 'positive' }}
              icon={<IconInfoCircle size={18} />}
            />
            <StatsCard
              label="Total Premium"
              value="$3.1M"
              trend={{ value: 12.4, type: 'positive' }}
              icon={<IconInfoCircle size={18} />}
            />
            <StatsCard
              label="Platform Rank"
              value="#3 of 47"
              trend={{ value: 2, type: 'positive', label: 'Positions' }}
              icon={<IconInfoCircle size={18} />}
            />
            <StatsCard
              label="Applications Completed"
              value="853"
              trend={{ value: 15.1, type: 'positive' }}
              icon={<IconInfoCircle size={18} />}
            />
          </SimpleGrid>
        </section>

        {/* Different trend types */}
        <section>
          <Title order={2} size="h3" mb="md">
            Trend Variations
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            Positive, negative, and neutral trends
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            <StatsCard
              label="Revenue"
              value="$45.2K"
              trend={{ value: 18.5, type: 'positive' }}
              icon={<IconUsers size={18} />}
            />
            <StatsCard
              label="Churn Rate"
              value="3.2%"
              trend={{ value: 5.1, type: 'negative' }}
              icon={<IconUsers size={18} />}
            />
            <StatsCard
              label="Avg. Session"
              value="4m 32s"
              trend={{ value: 0, type: 'neutral' }}
              icon={<IconUsers size={18} />}
            />
          </SimpleGrid>
        </section>

        {/* Cards without trends */}
        <section>
          <Title order={2} size="h3" mb="md">
            Without Trends
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            Cards displaying only the metric value
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
            <StatsCard label="Active Users" value="2,847" icon={<IconUsers size={18} />} />
            <StatsCard label="Premium Members" value="1,234" icon={<IconCrown size={18} />} />
            <StatsCard label="Achievements" value="156" icon={<IconTrophy size={18} />} />
            <StatsCard label="Completed Tasks" value="8,432" icon={<IconChecks size={18} />} />
          </SimpleGrid>
        </section>

        {/* Cards without icons */}
        <section>
          <Title order={2} size="h3" mb="md">
            Without Icons
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            Minimal cards with just label and value
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            <StatsCard label="Page Views" value="124,567" />
            <StatsCard label="Bounce Rate" value="42.3%" trend={{ value: 3.2, type: 'negative' }} />
            <StatsCard label="Conversion Rate" value="6.8%" trend={{ value: 1.5, type: 'positive' }} />
          </SimpleGrid>
        </section>

        {/* Cards with footer */}
        <section>
          <Title order={2} size="h3" mb="md">
            With Footer Content
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            Cards with additional footer information
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            <StatsCard
              label="Total Sales"
              value="$89,432"
              trend={{ value: 12.5, type: 'positive' }}
              icon={<IconInfoCircle size={18} />}
              footer={<Text size="xs" c="dimmed">Last updated: 2 hours ago</Text>}
            />
            <StatsCard
              label="New Customers"
              value="234"
              trend={{ value: 8.9, type: 'positive' }}
              icon={<IconInfoCircle size={18} />}
              footer={<Text size="xs" c="dimmed">This month</Text>}
            />
            <StatsCard
              label="Avg. Order Value"
              value="$127.45"
              trend={{ value: 2.3, type: 'negative' }}
              icon={<IconInfoCircle size={18} />}
              footer={<Text size="xs" c="dimmed">Compared to last week</Text>}
            />
          </SimpleGrid>
        </section>

        {/* Custom icon components */}
        <section>
          <Title order={2} size="h3" mb="md">
            Custom Icon Components
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            Demonstrating the flexible icon slot - any ReactNode can be passed
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            <StatsCard
              label="Users Online"
              value="1,247"
              trend={{ value: 4.2, type: 'positive' }}
              icon={
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: '#12b886',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  ✓
                </div>
              }
            />
            <StatsCard
              label="Messages"
              value="89"
              icon={
                <div style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  backgroundColor: '#ff6b6b',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  NEW
                </div>
              }
            />
            <StatsCard
              label="Score"
              value="9.8/10"
              trend={{ value: 0.3, type: 'positive' }}
              icon={<Text size="xl">⭐</Text>}
            />
          </SimpleGrid>
        </section>

        {/* Component structure info */}
        <section>
          <Title order={2} size="h3" mb="md">
            Atomic Component Structure
          </Title>
          <Paper withBorder p="md">
            <Stack gap="xs">
              <div>
                <Text fw={600} size="sm" mb={4}>Atoms (smallest building blocks):</Text>
                <Code block>
                  {`- CardLabel     → Label text\n- CardValue     → Primary value display\n- TrendIndicator → Icon + percentage with color logic`}
                </Code>
              </div>
              <div>
                <Text fw={600} size="sm" mb={4}>Molecules (combinations of atoms):</Text>
                <Code block>
                  {`- CardHeader → Label + optional icon slot\n- CardMetric → Value + optional trend\n- CardFooter → Optional footer content`}
                </Code>
              </div>
              <div>
                <Text fw={600} size="sm" mb={4}>Organism (main component):</Text>
                <Code block>
                  {`- StatsCard → Composes all components above`}
                </Code>
              </div>
              <div>
                <Text fw={600} size="sm" mt="md" mb={4}>Usage example:</Text>
                <Code block>
                  {`<StatsCard\n  label="Total Users"\n  value="12,847"\n  trend={{ value: 8.2, type: 'positive' }}\n  icon={<IconInfoCircle size={18} />}\n  footer={<Text size="xs">Last hour</Text>}\n/>`}
                </Code>
              </div>
            </Stack>
          </Paper>
        </section>
      </Stack>
    </Container>
  );
}
