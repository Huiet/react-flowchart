import React from 'react';
import { FlowChart } from './FlowChart';
import type { FlowNode } from './types';

// Example: Luma Conditional Coupon / Conditional Protection flowchart
const lumaFlowChartData: FlowNode = {
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

export const LumaFlowChartExample: React.FC = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5' }}>
      <FlowChart
        data={lumaFlowChartData}
        title="Hypothetical Scenario Analysis"
        subtitle="Trade Idea\nConditional Coupon / Conditional Protection"
      />
    </div>
  );
};

// Simple example for testing
const simpleFlowChartData: FlowNode = {
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

export const SimpleFlowChartExample: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <FlowChart
        data={simpleFlowChartData}
        title="Simple Decision Flow"
      />
    </div>
  );
};
