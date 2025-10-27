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
      next: 'decision-1',
    },

    // Decision 1: 100% autocall barrier
    {
      id: 'decision-1',
      variant: 'neutral',
      label: 'Are all underlyings at or\nabove the 100%\nautocall barrier?',
      nextYes: 'outcome-early-1',
      nextNo: 'decision-2',
    },

    // Outcome: Early redemption from decision 1
    {
      id: 'outcome-early-1',
      variant: 'secondary',
      label: 'Early Redemption +\n8.68% coupon',
      // Terminal - no next
    },

    // Decision 2: 80% coupon barrier
    {
      id: 'decision-2',
      variant: 'neutral',
      label: 'Are all underlyings at or\nabove the 80% coupon\nbarrier?',
      nextYes: 'outcome-payment-1',
      nextNo: 'period-2-3', // ← Goes DIRECTLY to Period 2-3!
    },

    // Outcome: Payment from decision 2 yes path
    {
      id: 'outcome-payment-1',
      variant: 'secondary',
      label: 'Payment of 8.68%\ncoupon (3 monthly)',
      next: 'period-2-3', // ← Also goes to Period 2-3!
    },

    // Period 2-3 (both paths above converge here)
    {
      id: 'period-2-3',
      variant: 'primary',
      label: 'Periods\n2-3',
      next: 'decision-3',
    },

    // Decision 3: 100% autocall barrier
    {
      id: 'decision-3',
      variant: 'neutral',
      label: 'Are all underlyings at or\nabove the 100%\nautocall barrier?',
      nextYes: 'outcome-early-2',
      nextNo: 'decision-4',
    },

    // Outcome: Early redemption from decision 3
    {
      id: 'outcome-early-2',
      variant: 'secondary',
      label: 'Early Redemption +\n8.68% coupon',
      // Terminal - no next
    },

    // Decision 4: 80% coupon barrier
    {
      id: 'decision-4',
      variant: 'neutral',
      label: 'Are all underlyings at or\nabove the 80% coupon\nbarrier?',
      nextYes: 'outcome-payment-2',
      nextNo: 'period-4',
    },

    // Outcome: Payment from decision 4
    {
      id: 'outcome-payment-2',
      variant: 'secondary',
      label: 'Payment of 8.68%\ncoupon (3 monthly)',
      next: 'period-4',
    },

    // Period 4
    {
      id: 'period-4',
      variant: 'primary',
      label: 'Period 4\n(Maturity\nDate)',
      next: 'decision-5',
    },

    // Decision 5: Final decision
    {
      id: 'decision-5',
      variant: 'neutral',
      label: 'Are all underlyings\nabove the 80 %\nautocall/protection\nbarrier?',
      nextYes: 'outcome-final-yes',
      nextNo: 'outcome-final-no',
    },

    // Final outcomes
    {
      id: 'outcome-final-yes',
      variant: 'secondary',
      label: '100% of Capital + 8.68%\ncoupon',
    },

    {
      id: 'outcome-final-no',
      variant: 'secondary',
      label: 'Investor receives the\nperformance of the worst\nperforming underlying',
    },
  ],
};

// ============================================================================
// EXAMPLE 2: Flexible Column Positioning
// ============================================================================
// This shows how variant and column are decoupled
const example2_FlexibleColumns: FlowChartData = {
  rootId: 'start',
  nodes: [
    {
      id: 'start',
      variant: 'primary',
      column: 1,
      label: 'Start Process',
      next: 'check',
    },
    {
      id: 'check',
      variant: 'neutral',
      column: 2,
      label: 'Valid\nInput?',
      nextYes: 'process-a',
      nextNo: 'error',
    },
    {
      id: 'process-a',
      variant: 'secondary',
      column: 3,
      label: 'Process\nSuccessfully',
      next: 'review',
    },
    {
      id: 'error',
      variant: 'secondary',
      column: 3,
      label: 'Error:\nInvalid Data',
      // Terminal
    },
    // This neutral node is in column 1 (usually primary column) - showcasing flexibility
    {
      id: 'review',
      variant: 'neutral',
      column: 1,
      label: 'Review\nRequired?',
      nextYes: 'manual-review',
      nextNo: 'complete',
    },
    // This primary node is in column 2 (usually neutral column) - showcasing flexibility
    {
      id: 'manual-review',
      variant: 'primary',
      column: 2,
      label: 'Manual\nReview',
      next: 'complete',
    },
    {
      id: 'complete',
      variant: 'secondary',
      column: 3,
      label: 'Complete',
    },
  ],
};

// ============================================================================
// EXAMPLE 3: Simple Linear Process
// ============================================================================
const example3_Linear: FlowChartData = {
  rootId: 'init',
  nodes: [
    {
      id: 'init',
      variant: 'primary',
      label: 'Initialize\nSystem',
      next: 'load',
    },
    {
      id: 'load',
      variant: 'neutral',
      label: 'Load\nConfiguration',
      next: 'validate',
    },
    {
      id: 'validate',
      variant: 'neutral',
      label: 'Validate\nSettings',
      next: 'start',
    },
    {
      id: 'start',
      variant: 'secondary',
      label: 'System\nReady',
    },
  ],
};

// ============================================================================
// EXAMPLE 4: Complex Decision Tree
// ============================================================================
const example4_ComplexTree: FlowChartData = {
  rootId: 'intake',
  nodes: [
    {
      id: 'intake',
      variant: 'primary',
      label: 'Customer\nIntake',
      next: 'type-check',
    },
    {
      id: 'type-check',
      variant: 'neutral',
      label: 'Account\nType?',
      nextYes: 'premium-check',
      nextNo: 'standard-process',
    },
    {
      id: 'premium-check',
      variant: 'neutral',
      label: 'Premium\nCustomer?',
      nextYes: 'vip-service',
      nextNo: 'regular-service',
    },
    {
      id: 'vip-service',
      variant: 'secondary',
      label: 'VIP\nService',
      next: 'complete',
    },
    {
      id: 'regular-service',
      variant: 'secondary',
      label: 'Regular\nService',
      next: 'complete',
    },
    {
      id: 'standard-process',
      variant: 'secondary',
      label: 'Standard\nProcess',
      next: 'quality-check',
    },
    {
      id: 'quality-check',
      variant: 'neutral',
      column: 1,
      label: 'Quality\nCheck?',
      nextYes: 'complete',
      nextNo: 'escalate',
    },
    {
      id: 'escalate',
      variant: 'secondary',
      column: 2,
      label: 'Escalate\nto Manager',
      next: 'complete',
    },
    {
      id: 'complete',
      variant: 'primary',
      column: 3,
      label: 'Complete',
    },
  ],
};

// ============================================================================
// EXAMPLE 5: Workflow with Loop
// ============================================================================
const example5_Loop: FlowChartData = {
  rootId: 'start',
  nodes: [
    {
      id: 'start',
      variant: 'primary',
      label: 'Start\nProcess',
      next: 'process-data',
    },
    {
      id: 'process-data',
      variant: 'neutral',
      label: 'Process\nData Batch',
      next: 'validation',
    },
    {
      id: 'validation',
      variant: 'neutral',
      label: 'Data\nValid?',
      nextYes: 'check-more',
      nextNo: 'fix-data',
    },
    {
      id: 'fix-data',
      variant: 'secondary',
      label: 'Fix\nIssues',
      next: 'process-data', // Loop back
    },
    {
      id: 'check-more',
      variant: 'neutral',
      label: 'More Data\nto Process?',
      nextYes: 'process-data', // Loop back
      nextNo: 'finalize',
    },
    {
      id: 'finalize',
      variant: 'secondary',
      label: 'Finalize\nResults',
    },
  ],
};

// ============================================================================
// EXAMPLE 6: Multi-Path Convergence
// ============================================================================
const example6_Convergence: FlowChartData = {
  rootId: 'entry',
  nodes: [
    {
      id: 'entry',
      variant: 'primary',
      label: 'Entry\nPoint',
      next: 'route',
    },
    {
      id: 'route',
      variant: 'neutral',
      label: 'Select\nRoute',
      nextYes: 'path-a',
      nextNo: 'path-b',
    },
    {
      id: 'path-a',
      variant: 'secondary',
      label: 'Process\nPath A',
      next: 'checkpoint',
    },
    {
      id: 'path-b',
      variant: 'secondary',
      label: 'Process\nPath B',
      next: 'checkpoint',
    },
    {
      id: 'checkpoint',
      variant: 'primary',
      label: 'Checkpoint\n(Converged)',
      next: 'final-check',
    },
    {
      id: 'final-check',
      variant: 'neutral',
      label: 'Final\nCheck OK?',
      nextYes: 'success',
      nextNo: 'failure',
    },
    {
      id: 'success',
      variant: 'secondary',
      label: 'Success',
    },
    {
      id: 'failure',
      variant: 'secondary',
      label: 'Failure',
    },
  ],
};

// ============================================================================
// EXAMPLE 7: Multi-Column Layout (4 columns)
// ============================================================================
const example7_MultiColumn: FlowChartData = {
  rootId: 'stage-1',
  nodes: [
    {
      id: 'stage-1',
      variant: 'primary',
      column: 1,
      label: 'Stage 1\nInitiation',
      next: 'stage-2',
    },
    {
      id: 'stage-2',
      variant: 'neutral',
      column: 2,
      label: 'Stage 2\nValidation',
      next: 'stage-3',
    },
    {
      id: 'stage-3',
      variant: 'secondary',
      column: 3,
      label: 'Stage 3\nProcessing',
      next: 'stage-4',
    },
    {
      id: 'stage-4',
      variant: 'primary',
      column: 4,
      label: 'Stage 4\nCompletion',
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
    description: 'Complex financial product scenario with multiple decision points and convergence paths',
    data: example1_Financial,
    hasActivePath: true,
    maxWidth: 3500,
    scale: 1.1,
  },
  {
    id: 'flexible',
    name: 'Flexible Column Positioning',
    description: 'Demonstrates decoupling of variant (colors) from column (positioning)',
    data: example2_FlexibleColumns,
    maxWidth: 650,
    scale: 1,
  },
  {
    id: 'linear',
    name: 'Simple Linear Process',
    description: 'Basic sequential workflow from start to finish',
    data: example3_Linear,
    maxWidth: 650,
    scale: 1,
  },
  {
    id: 'complex-tree',
    name: 'Complex Decision Tree',
    description: 'Multiple branching paths with various decision points',
    data: example4_ComplexTree,
    maxWidth: 800,
    scale: 1,
  },
  {
    id: 'loop',
    name: 'Workflow with Loop',
    description: 'Process that loops back for iteration and validation',
    data: example5_Loop,
    maxWidth: 650,
    scale: 1,
  },
  {
    id: 'convergence',
    name: 'Multi-Path Convergence',
    description: 'Multiple paths that converge at a common checkpoint',
    data: example6_Convergence,
    maxWidth: 650,
    scale: 1,
  },
  {
    id: 'multi-column',
    name: 'Multi-Column Layout',
    description: 'Linear flow across 4 columns using explicit column positioning',
    data: example7_MultiColumn,
    maxWidth: 900,
    scale: 1,
  },
];

export function FlowChartV2Demo() {
  const [selectedExample, setSelectedExample] = React.useState<string>('financial');
  const [showActivePath, setShowActivePath] = React.useState(false);

  const currentExample = examples.find(ex => ex.id === selectedExample) || examples[0];

  // Create data with active path for financial example
  const getDisplayData = (): FlowChartData => {
    if (selectedExample === 'financial' && showActivePath) {
      // Path: period-1 → decision-1 (No) → decision-2 (No, skip payment) → period-2-3 →
      //       decision-3 (No) → decision-4 (Yes, get payment) → outcome-payment-2
      // Stops here to show partial path highlighting
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
          Explore different flowchart scenarios. Use <code>variant</code> for colors and optional <code>column</code> for positioning.
        </p>

        {/* Example Selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1e3a5f' }}>
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

        {/* Toggle Active Path Button (only for financial example) */}
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
          {selectedExample === 'flexible' && (
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff3e0', borderRadius: '5px', border: '1px solid #ffb74d' }}>
              <p style={{ margin: 0, color: '#e65100', fontSize: '14px' }}>
                <strong>💡 Flexible Column Example:</strong> Notice how the "Review Required?" neutral node appears in column 1 (typically for primary nodes),
                and the "Manual Review" primary node appears in column 2 (typically for neutral nodes).
                This demonstrates the decoupling of <code>variant</code> (colors) from <code>column</code> (positioning).
              </p>
            </div>
          )}
          {selectedExample === 'loop' && (
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '5px', border: '1px solid #2196F3' }}>
              <p style={{ margin: 0, color: '#0d47a1', fontSize: '14px' }}>
                <strong>🔄 Loop Example:</strong> This flowchart demonstrates looping back to previous nodes.
                Notice how "Fix Issues" and "More Data to Process?" both loop back to "Process Data Batch".
              </p>
            </div>
          )}
          {selectedExample === 'convergence' && (
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f3e5f5', borderRadius: '5px', border: '1px solid #9C27B0' }}>
              <p style={{ margin: 0, color: '#4a148c', fontSize: '14px' }}>
                <strong>⚡ Convergence Example:</strong> Two different paths (Path A and Path B) converge at the same "Checkpoint" node.
                This showcases the power of the flat node structure with ID references.
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

          <h3 style={{ color: '#1e3a5f', marginTop: '20px' }}>1. Multiple Parents Converge</h3>
          <p>Several examples demonstrate multiple paths converging to the same node:</p>
          <ul>
            <li>
              <strong>Financial example:</strong> Decision 2 has two paths to Period 2-3 (with and without payment)
            </li>
            <li>
              <strong>Convergence example:</strong> Path A and Path B both converge at the Checkpoint node
            </li>
            <li>
              <strong>Loop example:</strong> Multiple decision points loop back to the same processing node
            </li>
          </ul>

          <h3 style={{ color: '#1e3a5f', marginTop: '20px' }}>2. Variant-Based Styling</h3>
          <p>Nodes use <code>variant</code> to determine their visual styling:</p>
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '5px',
              overflow: 'auto',
            }}
          >
            {`{
  id: 'decision-2',
  variant: 'neutral',  // Dictates colors (primary, neutral, or secondary)
  label: 'Are all underlyings at or above the 80% coupon barrier?',
  nextYes: 'outcome-payment-1',  // → outcome → period-2-3
  nextNo: 'period-2-3',          // → period-2-3 directly!
},
{
  id: 'outcome-payment-1',
  variant: 'secondary',
  label: 'Payment of 8.68% coupon (3 monthly)',
  next: 'period-2-3',  // Both converge here
}`}
          </pre>
          <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
            Variants: <code>'primary'</code> (dark blue), <code>'neutral'</code> (white), <code>'secondary'</code> (light blue)
          </p>

          <h3 style={{ color: '#1e3a5f', marginTop: '20px' }}>3. Flexible Column Positioning</h3>
          <p>The <code>column</code> property allows you to explicitly position nodes, decoupling visual style from layout:</p>
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '5px',
              overflow: 'auto',
            }}
          >
            {`{
  id: 'status',
  variant: 'neutral',  // White styling
  column: 1,           // But positioned in column 1 (typically for primary)
  label: 'Status Check',
},
{
  id: 'process',
  variant: 'primary',  // Dark blue styling
  column: 2,           // But positioned in column 2 (typically for neutral)
  label: 'Process Data',
}`}
          </pre>
          <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
            Default columns: <code>primary=1</code>, <code>neutral=2</code>, <code>secondary=3</code>.
            Omit <code>column</code> to use defaults.
          </p>

          <h3 style={{ color: '#1e3a5f', marginTop: '20px' }}>4. Simple Properties</h3>
          <p>Every node uses the same navigation properties:</p>
          <ul>
            <li>
              <code>variant</code> - Visual style: 'primary', 'neutral', or 'secondary'
            </li>
            <li>
              <code>label</code> - Text to display in the node
            </li>
            <li>
              <code>column</code> - Optional column position (defaults based on variant)
            </li>
            <li>
              <code>next</code> - Primary next node
            </li>
            <li>
              <code>nextYes</code> - Yes path (typically for neutral nodes)
            </li>
            <li>
              <code>nextNo</code> - No path (typically for neutral nodes)
            </li>
            <li>
              <code>isActive</code> - Optional, marks node as active for path highlighting
            </li>
          </ul>

          <h3 style={{ color: '#1e3a5f', marginTop: '20px' }}>5. Explicit References (Array Structure)</h3>
          <p>All nodes defined in a flat array - no nesting, just ID references. Each node has its own <code>id</code> property. This makes it easy to:</p>
          <ul>
            <li>Link any node to any other node</li>
            <li>Have multiple parents for the same child</li>
            <li>Create loops or cycles if needed</li>
            <li>Visualize the entire graph structure</li>
            <li>Avoid redundant ID storage (no duplicate keys)</li>
          </ul>

          <h3 style={{ color: '#1e3a5f', marginTop: '20px' }}>6. Automatic Scaling with maxWidth</h3>
          <p>The component supports automatic scaling to fit within a maximum width:</p>
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '5px',
              overflow: 'auto',
            }}
          >
            {`<FlowChartV2
  data={lumaDataV2}
  maxWidth={650}  // Automatically scales to fit within 650px
/>`}
          </pre>
          <p>You can also use manual scaling:</p>
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '5px',
              overflow: 'auto',
            }}
          >
            {`<FlowChartV2
  data={lumaDataV2}
  scale={1.5}  // 50% larger
/>`}
          </pre>

          <h3 style={{ color: '#1e3a5f', marginTop: '20px' }}>7. Active Path Highlighting</h3>
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
  next: 'decision-1',
  isActive: true,  // Mark as active to show this node is on the taken path
},
{
  id: 'decision-1',
  variant: 'neutral',
  label: 'Are all underlyings at or above...?',
  nextYes: 'outcome-early-1',
  nextNo: 'decision-2',
  isActive: true,  // This decision was reached
},
{
  id: 'outcome-early-1',
  variant: 'secondary',
  label: 'Early Redemption + 8.68% coupon',
  isActive: true,  // The Yes path was taken
}`}
          </pre>
          <p>
            Active nodes will be highlighted with:
          </p>
          <ul>
            <li>Thicker borders (4px vs 2px)</li>
            <li><strong>Color-coded arrows based on path:</strong>
              <ul>
                <li><span style={{ color: '#4CAF50', fontWeight: 'bold' }}>Green</span> for Yes paths</li>
                <li><span style={{ color: '#FF9800', fontWeight: 'bold' }}>Orange</span> for No paths</li>
                <li><span style={{ color: '#2196F3', fontWeight: 'bold' }}>Blue</span> for other active connections</li>
              </ul>
            </li>
            <li>Arrowheads match the line color</li>
            <li><strong>Inactive nodes shown at 40% opacity</strong></li>
            <li><strong>Inactive arrows shown in light gray</strong> (#cccccc)</li>
            <li><strong>Inactive Yes/No circles shown in gray</strong> (#9e9e9e) with white text</li>
            <li>No borders on Yes/No circles</li>
          </ul>
          <p style={{ marginTop: '15px', color: '#666' }}>
            Try the <strong>"Show Active Path"</strong> toggle above to see the active path highlighting in action!
          </p>
        </div>
      </div>
    </div>
  );
}
