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
      type: 'period',
      label: 'Period 1',
      next: 'decision-1',
    },

    // Decision 1: 100% autocall barrier
    {
      id: 'decision-1',
      type: 'decision',
      label: '',
      question: 'Are all underlyings at or\nabove the 100%\nautocall barrier?',
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
      label: '',
      question: 'Are all underlyings at or\nabove the 80% coupon\nbarrier?',
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
      type: 'period',
      label: 'Periods\n2-3',
      next: 'decision-3',
    },

    // Decision 3: 100% autocall barrier
    {
      id: 'decision-3',
      type: 'decision',
      label: '',
      question: 'Are all underlyings at or\nabove the 100%\nautocall barrier?',
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
      label: '',
      question: 'Are all underlyings at or\nabove the 80% coupon\nbarrier?',
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
      type: 'period',
      label: 'Period 4\n(Maturity\nDate)',
      next: 'decision-5',
    },

    // Decision 5: Final decision
    {
      id: 'decision-5',
      type: 'decision',
      label: '',
      question: 'Are all underlyings\nabove the 80 %\nautocall/protection\nbarrier?',
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
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', color: '#1e3a5f', marginBottom: '10px' }}>
          FlowChart V2 - Unified Reference Model
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          All nodes defined upfront with explicit next/nextYes/nextNo references. Automatically scaled to 650px max width.
        </p>

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
            data={lumaDataV2}
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
  question: 'Are all underlyings at or above the 80% coupon barrier?',
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

          <h3 style={{ color: '#1e3a5f', marginTop: '20px' }}>3. Simple Properties</h3>
          <p>Every node uses the same navigation properties:</p>
          <ul>
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
        </div>
      </div>
    </div>
  );
}
