import React, { useState } from 'react';
import { FlowChart } from './components/FlowChart';
import type { FlowNode } from './components/FlowChart';

// Luma Conditional Coupon example
const lumaData: FlowNode = {
  id: 'period-1',
  type: 'period',
  label: 'Period 1',
  next: {
    id: 'decision-1',
    type: 'decision',
    label: '',
    question: 'Are all underlyings at or\nabove the 100%\nautocall barrier?',
    yesPath: {
      id: 'outcome-1',
      type: 'outcome',
      label: 'Early Redemption +\n8.68% coupon',
    },
    noPath: {
      id: 'decision-2',
      type: 'decision',
      label: '',
      question: 'Are all underlyings at or\nabove the 80% coupon\nbarrier?',
      yesPath: {
        id: 'outcome-2',
        type: 'outcome',
        label: 'Payment of 8.68%\ncoupon (3 monthly)',
        next: {
          id: 'period-2-3',
          type: 'period',
          label: 'Periods\n2-3',
          next: {
            id: 'decision-3',
            type: 'decision',
            label: '',
            question: 'Are all underlyings at or\nabove the 100%\nautocall barrier?',
            yesPath: {
              id: 'outcome-3',
              type: 'outcome',
              label: 'Early Redemption +\n8.68% coupon',
            },
            noPath: {
              id: 'decision-4',
              type: 'decision',
              label: '',
              question: 'Are all underlyings at or\nabove the 80% coupon\nbarrier?',
              yesPath: {
                id: 'outcome-4',
                type: 'outcome',
                label: 'Payment of 8.68%\ncoupon (3 monthly)',
                next: {
                  id: 'period-4',
                  type: 'period',
                  label: 'Period 4\n(Maturity\nDate)',
                  next: {
                    id: 'decision-5',
                    type: 'decision',
                    label: '',
                    question: 'Are all underlyings\nabove the 80 %\nautocall/protection\nbarrier?',
                    yesPath: {
                      id: 'outcome-5',
                      type: 'outcome',
                      label: '100% of Capital + 8.68%\ncoupon',
                    },
                    noPath: {
                      id: 'outcome-6',
                      type: 'outcome',
                      label: 'Investor receives the\nperformance of the worst\nperforming underlying',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

// Simple decision tree example
const simpleData: FlowNode = {
  id: 'start',
  type: 'period',
  label: 'Start Process',
  next: {
    id: 'check',
    type: 'decision',
    label: '',
    question: 'Is condition met?',
    yesPath: {
      id: 'success',
      type: 'outcome',
      label: 'Success!\nProcess Complete',
    },
    noPath: {
      id: 'retry',
      type: 'outcome',
      label: 'Retry Process',
      next: {
        id: 'final-check',
        type: 'decision',
        label: '',
        question: 'Try again?',
        yesPath: {
          id: 'continue',
          type: 'outcome',
          label: 'Continue to next step',
        },
        noPath: {
          id: 'fail',
          type: 'outcome',
          label: 'Process Failed',
        },
      },
    },
  },
};

// Approval workflow example
const approvalData: FlowNode = {
  id: 'submit',
  type: 'period',
  label: 'Submit Request',
  next: {
    id: 'manager-review',
    type: 'decision',
    label: '',
    question: 'Manager\napproved?',
    yesPath: {
      id: 'budget-check',
      type: 'decision',
      label: '',
      question: 'Within\nbudget?',
      yesPath: {
        id: 'approved',
        type: 'outcome',
        label: 'Request Approved\nProceed with purchase',
      },
      noPath: {
        id: 'director-review',
        type: 'decision',
        label: '',
        question: 'Director\napproved?',
        yesPath: {
          id: 'special-approval',
          type: 'outcome',
          label: 'Special Approval\nGranted',
        },
        noPath: {
          id: 'rejected-budget',
          type: 'outcome',
          label: 'Request Rejected\nOver budget',
        },
      },
    },
    noPath: {
      id: 'rejected-manager',
      type: 'outcome',
      label: 'Request Rejected\nBy manager',
    },
  },
};

const examples = {
  luma: { data: lumaData, title: 'Hypothetical Scenario Analysis', subtitle: 'Trade Idea\nConditional Coupon / Conditional Protection' },
  simple: { data: simpleData, title: 'Simple Decision Flow', subtitle: '' },
  approval: { data: approvalData, title: 'Approval Workflow', subtitle: 'Purchase Request Process' },
};

export function FlowChartDemo() {
  const [selectedExample, setSelectedExample] = useState<keyof typeof examples>('luma');
  const example = examples[selectedExample];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', color: '#1e3a5f', marginBottom: '10px' }}>
          FlowChart Component Demo
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          Dynamic SVG-based flowcharts with conditional branching
        </p>

        {/* Example selector */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '30px',
        }}>
          {(Object.keys(examples) as Array<keyof typeof examples>).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedExample(key)}
              style={{
                padding: '10px 20px',
                backgroundColor: selectedExample === key ? '#1e3a5f' : '#ffffff',
                color: selectedExample === key ? '#ffffff' : '#1e3a5f',
                border: '2px solid #1e3a5f',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                textTransform: 'capitalize',
              }}
            >
              {key === 'luma' ? 'Luma Example' : key}
            </button>
          ))}
        </div>

        {/* FlowChart */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          padding: '20px',
        }}>
          <FlowChart
            data={example.data}
            title={example.title}
            subtitle={example.subtitle}
          />
        </div>

        {/* Instructions */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ color: '#1e3a5f', marginTop: 0 }}>How to Use</h2>
          <pre style={{
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '5px',
            overflow: 'auto',
          }}>
{`import { FlowChart } from './components/FlowChart';
import type { FlowNode } from './components/FlowChart';

const myFlow: FlowNode = {
  id: 'start',
  type: 'period',
  label: 'Start',
  next: {
    id: 'decision1',
    type: 'decision',
    question: 'Is condition met?',
    yesPath: {
      id: 'yes-outcome',
      type: 'outcome',
      label: 'Success!',
    },
    noPath: {
      id: 'no-outcome',
      type: 'outcome',
      label: 'Failed',
    },
  },
};

<FlowChart data={myFlow} title="My Flow" />`}
          </pre>

          <h3 style={{ color: '#1e3a5f', marginTop: '20px' }}>Node Types</h3>
          <ul>
            <li><strong>period</strong> - Dark blue boxes for timeline periods or process stages</li>
            <li><strong>decision</strong> - White boxes for yes/no questions</li>
            <li><strong>outcome</strong> - Light blue boxes for results or actions</li>
          </ul>

          <h3 style={{ color: '#1e3a5f' }}>Features</h3>
          <ul>
            <li>Pure SVG rendering (crisp at any zoom level)</li>
            <li>Automatic layout calculation</li>
            <li>Nested conditional branching</li>
            <li>Multi-line text support (use \n)</li>
            <li>TypeScript support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
