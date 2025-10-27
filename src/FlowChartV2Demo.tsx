import React from 'react';
import { FlowChartV2 } from './components/FlowChartV2';
import type { FlowChartData } from './components/FlowChartV2';

// ============================================================================
// EXAMPLE 1: Financial Product Workflow (Luma)
// ============================================================================
// This example uses default column positioning (primary=1, neutral=2, secondary=3)
const example1_Financial: FlowChartData = {
  rootId: 'period-1',
  nodes: [
    // Period 1
    {
      id: 'period-1',
      variant: 'primary',
      label: 'Period 1',
      connections: [{ targetId: 'decision-1' }],
    },

    // Decision 1: 100% autocall barrier
    {
      id: 'decision-1',
      variant: 'neutral',
      label: 'Are all underlyings at or\nabove the 100%\nautocall barrier?',
      connections: [
        { targetId: 'outcome-early-1', label: 'Yes', color: 'green' },
        { targetId: 'decision-2', label: 'No', color: 'red' },
      ],
    },

    // Outcome: Early redemption from decision 1
    {
      id: 'outcome-early-1',
      variant: 'secondary',
      label: 'Early Redemption +\n8.68% coupon',
      connections: [], // Terminal - no next
    },

    // Decision 2: 80% coupon barrier
    {
      id: 'decision-2',
      variant: 'neutral',
      label: 'Are all underlyings at or\nabove the 80% coupon\nbarrier?',
      connections: [
        { targetId: 'outcome-payment-1', label: 'Yes', color: 'green' },
        { targetId: 'period-2-3', label: 'No', color: 'red' }, // Goes DIRECTLY to Period 2-3!
      ],
    },

    // Outcome: Payment from decision 2 yes path
    {
      id: 'outcome-payment-1',
      variant: 'secondary',
      label: 'Payment of 8.68%\ncoupon (3 monthly)',
      connections: [{ targetId: 'period-2-3' }], // Also goes to Period 2-3!
    },

    // Period 2-3 (both paths above converge here)
    {
      id: 'period-2-3',
      variant: 'primary',
      label: 'Periods\n2-3',
      connections: [{ targetId: 'decision-3' }],
    },

    // Decision 3: 100% autocall barrier
    {
      id: 'decision-3',
      variant: 'neutral',
      label: 'Are all underlyings at or\nabove the 100%\nautocall barrier?',
      connections: [
        { targetId: 'outcome-early-2', label: 'Yes', color: 'green' },
        { targetId: 'decision-4', label: 'No', color: 'red' },
      ],
    },

    // Outcome: Early redemption from decision 3
    {
      id: 'outcome-early-2',
      variant: 'secondary',
      label: 'Early Redemption +\n8.68% coupon',
      connections: [], // Terminal - no next
    },

    // Decision 4: 80% coupon barrier
    {
      id: 'decision-4',
      variant: 'neutral',
      label: 'Are all underlyings at or\nabove the 80% coupon\nbarrier?',
      connections: [
        { targetId: 'outcome-payment-2', label: 'Yes', color: 'green' },
        { targetId: 'period-4', label: 'No', color: 'red' },
      ],
    },

    // Outcome: Payment from decision 4
    {
      id: 'outcome-payment-2',
      variant: 'secondary',
      label: 'Payment of 8.68%\ncoupon (3 monthly)',
      connections: [{ targetId: 'period-4' }],
    },

    // Period 4
    {
      id: 'period-4',
      variant: 'primary',
      label: 'Period 4\n(Maturity\nDate)',
      connections: [{ targetId: 'decision-5' }],
    },

    // Decision 5: Final decision
    {
      id: 'decision-5',
      variant: 'neutral',
      label: 'Are all underlyings\nabove the 80 %\nautocall/protection\nbarrier?',
      connections: [
        { targetId: 'outcome-final-yes', label: 'Yes', color: 'green' },
        { targetId: 'outcome-final-no', label: 'No', color: 'red' },
      ],
    },

    // Final outcomes
    {
      id: 'outcome-final-yes',
      variant: 'secondary',
      label: '100% of Capital + 8.68%\ncoupon',
      connections: [],
    },

    {
      id: 'outcome-final-no',
      variant: 'secondary',
      label: 'Investor receives the\nperformance of the worst\nperforming underlying',
      connections: [],
    },
  ],
};

// ============================================================================
// EXAMPLE 2: Loop-Back Pattern
// ============================================================================
// Demonstrates arrows pointing back to earlier steps
const example2_LoopBack: FlowChartData = {
  rootId: 'start',
  nodes: [
    {
      id: 'start',
      variant: 'primary',
      label: 'Start\nProcess',
      connections: [{ targetId: 'process-data' }],
    },
    {
      id: 'process-data',
      variant: 'neutral',
      label: 'Process\nData Batch',
      connections: [{ targetId: 'validation' }],
    },
    {
      id: 'validation',
      variant: 'neutral',
      label: 'Data\nValid?',
      connections: [
        { targetId: 'check-more', label: 'Yes', color: 'green' },
        { targetId: 'fix-data', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'fix-data',
      variant: 'secondary',
      label: 'Fix\nIssues',
      connections: [
        { targetId: 'process-data', label: 'Retry', color: 'blue' }, // Loop back
      ],
    },
    {
      id: 'check-more',
      variant: 'neutral',
      label: 'More Data\nto Process?',
      connections: [
        { targetId: 'process-data', label: 'Yes', color: 'green' }, // Loop back
        { targetId: 'finalize', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'finalize',
      variant: 'secondary',
      label: 'Finalize\nResults',
      connections: [],
    },
  ],
};

// ============================================================================
// EXAMPLE 3: Multiple Connections with Different Colors
// ============================================================================
// Demonstrates multiple arrows from the same node with different colors
const example3_MultipleConnections: FlowChartData = {
  rootId: 'intake',
  nodes: [
    {
      id: 'intake',
      variant: 'primary',
      label: 'Customer\nRequest',
      connections: [{ targetId: 'priority-check' }],
    },
    {
      id: 'priority-check',
      variant: 'neutral',
      label: 'Priority\nLevel?',
      connections: [
        { targetId: 'urgent-path', label: 'Urgent', color: 'red' },
        { targetId: 'normal-path', label: 'Normal', color: 'blue' },
        { targetId: 'low-path', label: 'Low', color: 'green' },
      ],
    },
    {
      id: 'urgent-path',
      variant: 'secondary',
      label: 'Immediate\nEscalation',
      connections: [{ targetId: 'resolution' }],
    },
    {
      id: 'normal-path',
      variant: 'secondary',
      label: 'Standard\nProcessing',
      connections: [{ targetId: 'quality-check' }],
    },
    {
      id: 'low-path',
      variant: 'secondary',
      label: 'Queue for\nLater',
      connections: [{ targetId: 'quality-check' }],
    },
    {
      id: 'quality-check',
      variant: 'neutral',
      column: 1,
      label: 'Meets\nStandards?',
      connections: [
        { targetId: 'resolution', label: 'Yes', color: 'green' },
        { targetId: 'rework', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'rework',
      variant: 'secondary',
      column: 2,
      label: 'Requires\nRework',
      connections: [
        { targetId: 'normal-path', label: 'Reprocess', color: 'orange' }, // Loop back
      ],
    },
    {
      id: 'resolution',
      variant: 'primary',
      column: 3,
      label: 'Resolved',
      connections: [],
    },
  ],
};

// ============================================================================
// EXAMPLE 4: Conditional Path with Multiple Decision Points
// ============================================================================
const example4_ConditionalFlow: FlowChartData = {
  rootId: 'init',
  nodes: [
    {
      id: 'init',
      variant: 'primary',
      label: 'Initialize',
      connections: [{ targetId: 'auth-check' }],
    },
    {
      id: 'auth-check',
      variant: 'neutral',
      label: 'User\nAuthenticated?',
      connections: [
        { targetId: 'role-check', label: 'Yes', color: 'green' },
        { targetId: 'login', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'login',
      variant: 'secondary',
      label: 'Login\nRequired',
      connections: [{ targetId: 'auth-check', label: 'Retry', color: 'blue' }],
    },
    {
      id: 'role-check',
      variant: 'neutral',
      label: 'Has Admin\nRole?',
      connections: [
        { targetId: 'admin-panel', label: 'Yes', color: 'green' },
        { targetId: 'user-panel', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'admin-panel',
      variant: 'secondary',
      label: 'Admin\nDashboard',
      connections: [],
    },
    {
      id: 'user-panel',
      variant: 'secondary',
      label: 'User\nDashboard',
      connections: [],
    },
  ],
};

// ============================================================================
// Example Definitions
// ============================================================================
interface ExampleDef {
  id: string;
  name: string;
  description: string;
  data: FlowChartData;
  hasActivePath?: boolean;
  maxWidth?: number;
  scale?: number;
}

const examples: ExampleDef[] = [
  {
    id: 'financial',
    name: 'Financial Product Workflow',
    description:
      'Complex financial product scenario with multiple decision points and convergence paths',
    data: example1_Financial,
    hasActivePath: true,
    maxWidth: 3500,
    scale: 1.1,
  },
  {
    id: 'loop-back',
    name: 'Loop-Back Pattern',
    description: 'Demonstrates arrows pointing back to earlier steps in the workflow',
    data: example2_LoopBack,
    hasActivePath: true,
    maxWidth: 650,
    scale: 1,
  },
  {
    id: 'multiple-connections',
    name: 'Multiple Connections with Colors',
    description: 'Shows multiple arrows from the same node with different colors and labels',
    data: example3_MultipleConnections,
    hasActivePath: true,
    maxWidth: 800,
    scale: 1,
  },
  {
    id: 'conditional-flow',
    name: 'Conditional Flow',
    description: 'Authentication and authorization flow with retry logic',
    data: example4_ConditionalFlow,
    maxWidth: 650,
    scale: 1,
  },
];

export function FlowChartV2Demo() {
  const [selectedExample, setSelectedExample] = React.useState<string>('financial');
  const [showActivePath, setShowActivePath] = React.useState(false);

  const currentExample = examples.find((ex) => ex.id === selectedExample) || examples[0];

  // Create data with active path for examples that support it
  const getDisplayData = (): FlowChartData => {
    if (!showActivePath || !currentExample.hasActivePath) {
      return currentExample.data;
    }

    if (selectedExample === 'financial') {
      // Path: period-1 → decision-1 (No) → decision-2 (No, skip payment) → period-2-3 →
      //       decision-3 (No) → decision-4 (Yes, get payment) → outcome-payment-2
      return {
        ...currentExample.data,
        nodes: currentExample.data.nodes.map((node) => {
          const activeNodeIds = [
            'period-1',
            'decision-1',
            'decision-2',
            'period-2-3',
            'decision-3',
            'decision-4',
            'outcome-payment-2',
          ];
          return {
            ...node,
            isActive: activeNodeIds.includes(node.id),
          };
        }),
      };
    }

    if (selectedExample === 'loop-back') {
      // Path: Shows a loop through fix-data back to process-data
      return {
        ...currentExample.data,
        nodes: currentExample.data.nodes.map((node) => {
          const activeNodeIds = ['start', 'process-data', 'validation', 'fix-data'];
          return {
            ...node,
            isActive: activeNodeIds.includes(node.id),
          };
        }),
      };
    }

    if (selectedExample === 'multiple-connections') {
      // Path: Shows the urgent path through to resolution
      return {
        ...currentExample.data,
        nodes: currentExample.data.nodes.map((node) => {
          const activeNodeIds = ['intake', 'priority-check', 'urgent-path', 'resolution'];
          return {
            ...node,
            isActive: activeNodeIds.includes(node.id),
          };
        }),
      };
    }

    return currentExample.data;
  };

  const displayData = getDisplayData();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', color: '#1e3a5f', marginBottom: '10px' }}>
          FlowChart V2 - Examples Gallery
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
          Explore different flowchart scenarios. Each node has a <code>connections</code> array with
          targetId, label, and color.
        </p>

        {/* Example Selector */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1e3a5f' }}
          >
            Select Example:
          </label>
          <select
            value={selectedExample}
            onChange={(e) => {
              setSelectedExample(e.target.value);
              setShowActivePath(false); // Reset active path when switching examples
            }}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              borderRadius: '6px',
              border: '2px solid #2196F3',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {examples.map((example) => (
              <option key={example.id} value={example.id}>
                {example.name}
              </option>
            ))}
          </select>
          <p style={{ marginTop: '8px', color: '#666', fontSize: '14px', fontStyle: 'italic' }}>
            {currentExample.description}
          </p>
        </div>

        {/* Toggle Active Path Button (only for examples that support it) */}
        {currentExample.hasActivePath && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button
              onClick={() => setShowActivePath(!showActivePath)}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#ffffff',
                backgroundColor: showActivePath ? '#4CAF50' : '#2196F3',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
              }}
            >
              {showActivePath ? '✓ Active Path Shown' : 'Show Active Path'}
            </button>
          </div>
        )}

        {/* FlowChart */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            padding: '20px',
          }}
        >
          {selectedExample === 'loop-back' && (
            <div
              style={{
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: '#e3f2fd',
                borderRadius: '5px',
                border: '1px solid #2196F3',
              }}
            >
              <p style={{ margin: 0, color: '#0d47a1', fontSize: '14px' }}>
                <strong>🔄 Loop-Back Example:</strong> This flowchart demonstrates looping back to
                previous nodes. Notice how "Fix Issues" and "More Data to Process?" both loop back
                to "Process Data Batch". These arrows point from later steps to earlier steps in the
                flow.
              </p>
            </div>
          )}
          {selectedExample === 'multiple-connections' && (
            <div
              style={{
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: '#f3e5f5',
                borderRadius: '5px',
                border: '1px solid #9C27B0',
              }}
            >
              <p style={{ margin: 0, color: '#4a148c', fontSize: '14px' }}>
                <strong>🎨 Multiple Connections:</strong> The "Priority Level?" node has three
                outgoing connections with different colors (red for Urgent, blue for Normal, green
                for Low). This demonstrates how the connections array can handle multiple paths with
                distinct visual indicators.
              </p>
            </div>
          )}
          <FlowChartV2
            data={displayData}
            title={currentExample.name}
            subtitle={currentExample.description}
            maxWidth={currentExample.maxWidth}
            scale={currentExample.scale}
          />
        </div>

        {/* Key Features */}
        <div
          style={{
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}
        >
          <h2 style={{ color: '#1e3a5f', marginTop: 0 }}>Key Features Demonstrated</h2>

          <h3 style={{ color: '#1e3a5f', marginTop: '20px' }}>1. Connections Array Structure</h3>
          <p>
            Nodes now use a flexible <code>connections</code> array instead of fixed properties:
          </p>
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '5px',
              overflow: 'auto',
            }}
          >
            {`{
  id: 'decision-1',
  variant: 'neutral',
  label: 'Are all underlyings at or above...?',
  connections: [
    { targetId: 'outcome-early-1', label: 'Yes', color: 'green' },
    { targetId: 'decision-2', label: 'No', color: 'red' },
  ],
}`}
          </pre>
          <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
            Each connection specifies: <code>targetId</code> (destination node), optional{' '}
            <code>label</code> (text on arrow), and optional <code>color</code> (arrow and label
            circle color: 'green', 'red', 'blue', 'orange', or 'default').
          </p>

          <h3 style={{ color: '#1e3a5f', marginTop: '20px' }}>2. Loop-Back Patterns</h3>
          <p>
            Arrows can point back to earlier steps in the workflow, enabling retry logic and
            iterative processes:
          </p>
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '5px',
              overflow: 'auto',
            }}
          >
            {`{
  id: 'fix-data',
  variant: 'secondary',
  label: 'Fix Issues',
  connections: [
    { targetId: 'process-data', label: 'Retry', color: 'blue' },
  ],
},
{
  id: 'check-more',
  variant: 'neutral',
  label: 'More Data to Process?',
  connections: [
    { targetId: 'process-data', label: 'Yes', color: 'green' }, // Loop back
    { targetId: 'finalize', label: 'No', color: 'red' },
  ],
}`}
          </pre>
          <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
            See the <strong>Loop-Back Pattern</strong> example to visualize these connections in
            action.
          </p>

          <h3 style={{ color: '#1e3a5f', marginTop: '20px' }}>
            3. Multiple Connections with Colors
          </h3>
          <p>
            A single node can have multiple outgoing connections, each with its own label and color:
          </p>
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '5px',
              overflow: 'auto',
            }}
          >
            {`{
  id: 'priority-check',
  variant: 'neutral',
  label: 'Priority Level?',
  connections: [
    { targetId: 'urgent-path', label: 'Urgent', color: 'red' },
    { targetId: 'normal-path', label: 'Normal', color: 'blue' },
    { targetId: 'low-path', label: 'Low', color: 'green' },
  ],
}`}
          </pre>
          <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
            Available colors: <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>green</span>,{' '}
            <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>red</span>,{' '}
            <span style={{ color: '#2196F3', fontWeight: 'bold' }}>blue</span>,{' '}
            <span style={{ color: '#FF9800', fontWeight: 'bold' }}>orange</span>, or default (blue).
          </p>

          <h3 style={{ color: '#1e3a5f', marginTop: '20px' }}>4. Variant-Based Styling</h3>
          <p>
            Nodes use <code>variant</code> to determine their visual styling:
          </p>
          <ul>
            <li>
              <code>'primary'</code> - Dark blue background, white text
            </li>
            <li>
              <code>'neutral'</code> - White background, dark text, blue border
            </li>
            <li>
              <code>'secondary'</code> - Light blue background, dark text
            </li>
          </ul>

          <h3 style={{ color: '#1e3a5f', marginTop: '20px' }}>5. Flexible Column Positioning</h3>
          <p>
            The <code>column</code> property allows explicit positioning, decoupling style from
            layout:
          </p>
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '5px',
              overflow: 'auto',
            }}
          >
            {`{
  id: 'quality-check',
  variant: 'neutral',  // White styling
  column: 1,           // But positioned in column 1
  label: 'Meets Standards?',
}`}
          </pre>
          <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
            Default columns: <code>primary=1</code>, <code>neutral=2</code>,{' '}
            <code>secondary=3</code>. Omit <code>column</code> to use defaults.
          </p>

          <h3 style={{ color: '#1e3a5f', marginTop: '20px' }}>6. Active Path Highlighting</h3>
          <p>Mark nodes as active to visualize the path taken:</p>
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '5px',
              overflow: 'auto',
            }}
          >
            {`{
  id: 'period-1',
  variant: 'primary',
  label: 'Period 1',
  connections: [{ targetId: 'decision-1' }],
  isActive: true,  // Mark as active
}`}
          </pre>
          <p>Active nodes and connections are highlighted with:</p>
          <ul>
            <li>Thicker borders on active nodes (4px vs 2px)</li>
            <li>
              <strong>Color-coded arrows:</strong>
              <ul>
                <li>
                  <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>Green</span> for
                  Yes/success paths
                </li>
                <li>
                  <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>Red</span> for No/failure
                  paths
                </li>
                <li>
                  <span style={{ color: '#2196F3', fontWeight: 'bold' }}>Blue</span> for neutral
                  paths
                </li>
                <li>
                  <span style={{ color: '#FF9800', fontWeight: 'bold' }}>Orange</span> for
                  alternative paths
                </li>
              </ul>
            </li>
            <li>Matching arrowhead colors</li>
            <li>
              <strong>Inactive nodes at 40% opacity</strong>
            </li>
            <li>
              <strong>Inactive arrows in light gray</strong>
            </li>
          </ul>
          <p style={{ marginTop: '15px', color: '#666' }}>
            Try the <strong>"Show Active Path"</strong> toggle to see active path highlighting!
          </p>

          <h3 style={{ color: '#1e3a5f', marginTop: '20px' }}>
            7. Manhattan Routing with Collision Avoidance
          </h3>
          <p>Arrows use Manhattan (perpendicular) routing and automatically avoid node overlaps:</p>
          <ul>
            <li>Arrows travel minimum distance in exit direction before turning</li>
            <li>No 180-degree immediate reversals (down → horizontal → up)</li>
            <li>Staggered arrows when multiple connections exit the same side</li>
            <li>Perpendicular start indicators show arrow origin</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
