import React from 'react';
import { FlowChartV2 } from './components/FlowChartV2';
import type { FlowChartData } from './components/FlowChartV2';

// Define ALL nodes upfront with explicit next/nextYes/nextNo references
const lumaDataV2: FlowChartData = {
  rootId: 'period-1',
  nodes: [
    // Period 1
    {
      id: 'period-1',
      type: 'start',
      label: 'Period 1',
      next: 'decision-1',
    },

    // Decision 1: 100% autocall barrier
    {
      id: 'decision-1',
      type: 'decision',
      label: 'Are all underlyings at or\nabove the 100%\nautocall barrier?',
      nextYes: 'outcome-early-1',
      nextNo: 'decision-2',
    },

    // Outcome: Early redemption from decision 1
    {
      id: 'outcome-early-1',
      type: 'outcome',
      label: 'Early Redemption +\n8.68% coupon',
      // Terminal - no next
    },

    // Decision 2: 80% coupon barrier
    {
      id: 'decision-2',
      type: 'decision',
      label: 'Are all underlyings at or\nabove the 80% coupon\nbarrier?',
      nextYes: 'outcome-payment-1',
      nextNo: 'period-2-3', // ← Goes DIRECTLY to Period 2-3!
    },

    // Outcome: Payment from decision 2 yes path
    {
      id: 'outcome-payment-1',
      type: 'outcome',
      label: 'Payment of 8.68%\ncoupon (3 monthly)',
      next: 'period-2-3', // ← Also goes to Period 2-3!
    },

    // Period 2-3 (both paths above converge here)
    {
      id: 'period-2-3',
      type: 'start',
      label: 'Periods\n2-3',
      next: 'decision-3',
    },

    // Decision 3: 100% autocall barrier
    {
      id: 'decision-3',
      type: 'decision',
      label: 'Are all underlyings at or\nabove the 100%\nautocall barrier?',
      nextYes: 'outcome-early-2',
      nextNo: 'decision-4',
    },

    // Outcome: Early redemption from decision 3
    {
      id: 'outcome-early-2',
      type: 'outcome',
      label: 'Early Redemption +\n8.68% coupon',
      // Terminal - no next
    },

    // Decision 4: 80% coupon barrier
    {
      id: 'decision-4',
      type: 'decision',
      label: 'Are all underlyings at or\nabove the 80% coupon\nbarrier?',
      nextYes: 'outcome-payment-2',
      nextNo: 'period-4',
    },

    // Outcome: Payment from decision 4
    {
      id: 'outcome-payment-2',
      type: 'outcome',
      label: 'Payment of 8.68%\ncoupon (3 monthly)',
      next: 'period-4',
    },

    // Period 4
    {
      id: 'period-4',
      type: 'start',
      label: 'Period 4\n(Maturity\nDate)',
      next: 'decision-5',
    },

    // Decision 5: Final decision
    {
      id: 'decision-5',
      type: 'decision',
      label: 'Are all underlyings\nabove the 80 %\nautocall/protection\nbarrier?',
      nextYes: 'outcome-final-yes',
      nextNo: 'outcome-final-no',
    },

    // Final outcomes
    {
      id: 'outcome-final-yes',
      type: 'outcome',
      label: '100% of Capital + 8.68%\ncoupon',
    },

    {
      id: 'outcome-final-no',
      type: 'outcome',
      label: 'Investor receives the\nperformance of the worst\nperforming underlying',
    },
  ],
};

export function FlowChartV2Demo() {
  const [showActivePath, setShowActivePath] = React.useState(false);

  // Create data with active path
  // Path: period-1 → decision-1 (No) → decision-2 (No, skip payment) → period-2-3 →
  //       decision-3 (No) → decision-4 (Yes, get payment) → outcome-payment-2
  // Stops here to show partial path highlighting
  const dataWithActivePath: FlowChartData = {
    ...lumaDataV2,
    nodes: lumaDataV2.nodes.map((node) => {
      // Mark specific nodes as active to show an example path where:
      // - Decision 1: No (don't redeem early)
      // - Decision 2: No (don't get first payment, coupon barrier not met)
      // - Decision 3: No (don't redeem early)
      // - Decision 4: Yes (get second payment, coupon barrier met)
      // Path stops at outcome-payment-2 to demonstrate partial highlighting
      const activeNodeIds = [
        'period-1',
        'decision-1',
        'decision-2',
        'period-2-3', // Reached directly via decision-2 No path (no payment)
        'decision-3',
        'decision-4',
        'outcome-payment-2', // Payment received here - path ends
      ];
      return {
        ...node,
        isActive: activeNodeIds.includes(node.id),
      };
    }),
  };

  const currentData = showActivePath ? dataWithActivePath : lumaDataV2;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', color: '#1e3a5f', marginBottom: '10px' }}>
          FlowChart V2 - Unified Reference Model
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '10px' }}>
          All nodes defined upfront with explicit next/nextYes/nextNo references. Automatically scaled to 650px max width.
        </p>
        <p style={{ textAlign: 'center', color: '#999', fontSize: '14px', marginBottom: '20px' }}>
          💡 Tip: Add <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>isActive: true</code> to nodes to highlight the active path
        </p>

        {/* Toggle Button */}
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

        {/* FlowChart */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            padding: '20px',
          }}
        >
          <FlowChartV2
            data={currentData}
            title="Hypothetical Scenario Analysis"
            subtitle="Trade Idea Conditional Coupon / Conditional Protection"
            maxWidth={3500}
            scale={1.1}
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
          <p>Decision 2 demonstrates two paths to the same Period 2-3:</p>
          <ul>
            <li>
              <strong>Yes path:</strong> → Payment outcome → Period 2-3
            </li>
            <li>
              <strong>No path:</strong> → Period 2-3 (directly!)
            </li>
          </ul>

          <h3 style={{ color: '#1e3a5f', marginTop: '20px' }}>2. Unified Node Structure (Array-Based)</h3>
          <p>All nodes use a simple, consistent structure with just a <code>label</code> property:</p>
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
  type: 'decision',
  label: 'Are all underlyings at or above the 80% coupon barrier?',
  nextYes: 'outcome-payment-1',  // → outcome → period-2-3
  nextNo: 'period-2-3',          // → period-2-3 directly!
},
{
  id: 'outcome-payment-1',
  type: 'outcome',
  label: 'Payment of 8.68% coupon (3 monthly)',
  next: 'period-2-3',  // Both converge here
}`}
          </pre>
          <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
            Note: Decision nodes use the same <code>label</code> property for their question text.
            Node types: <code>'start'</code>, <code>'decision'</code>, or <code>'outcome'</code>
          </p>

          <h3 style={{ color: '#1e3a5f', marginTop: '20px' }}>3. Simple Properties</h3>
          <p>Every node uses the same navigation properties:</p>
          <ul>
            <li>
              <code>label</code> - Text to display in the node (used for all node types)
            </li>
            <li>
              <code>next</code> - Primary next node
            </li>
            <li>
              <code>nextYes</code> - Yes path (decisions only)
            </li>
            <li>
              <code>nextNo</code> - No path (decisions only)
            </li>
          </ul>

          <h3 style={{ color: '#1e3a5f', marginTop: '20px' }}>4. Explicit References (Array Structure)</h3>
          <p>All nodes defined in a flat array - no nesting, just ID references. Each node has its own <code>id</code> property. This makes it easy to:</p>
          <ul>
            <li>Link any node to any other node</li>
            <li>Have multiple parents for the same child</li>
            <li>Create loops or cycles if needed</li>
            <li>Visualize the entire graph structure</li>
            <li>Avoid redundant ID storage (no duplicate keys)</li>
          </ul>

          <h3 style={{ color: '#1e3a5f', marginTop: '20px' }}>5. Automatic Scaling with maxWidth</h3>
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
  type: 'start',
  label: 'Period 1',
  next: 'decision-1',
  isActive: true,  // Mark as active to show this node is on the taken path
},
{
  id: 'decision-1',
  type: 'decision',
  label: 'Are all underlyings at or above...?',
  nextYes: 'outcome-early-1',
  nextNo: 'decision-2',
  isActive: true,  // This decision was reached
},
{
  id: 'outcome-early-1',
  type: 'outcome',
  label: 'Early Redemption + 8.68% coupon',
  isActive: true,  // The Yes path was taken
}`}
          </pre>
          <p>
            Active nodes will be highlighted with:
          </p>
          <ul>
            <li>Thicker borders (4px vs 2px)</li>
            <li>Brighter colors for nodes</li>
            <li><strong>Active decision nodes use gray borders</strong> (#757575) instead of orange</li>
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
