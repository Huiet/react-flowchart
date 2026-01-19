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
      column: 1,
      label: 'Period 1',
      connections: [{ targetId: 'decision-1' }],
    },

    // Decision 1: 100% autocall barrier
    {
      id: 'decision-1',
      variant: 'neutral',
      column: 2,
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
      column: 3,
      label: 'Early Redemption +\n8.68% coupon',
      connections: [], // Terminal - no next
    },

    // Decision 2: 80% coupon barrier
    {
      id: 'decision-2',
      variant: 'neutral',
      column: 2,
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
      column: 3,
      label: 'Payment of 8.68%\ncoupon (3 monthly)',
      connections: [{ targetId: 'period-2-3' }], // Also goes to Period 2-3!
    },

    // Period 2-3 (both paths above converge here)
    {
      id: 'period-2-3',
      variant: 'primary',
      column: 1,
      label: 'Periods\n2-3',
      connections: [{ targetId: 'decision-3' }],
    },

    // Decision 3: 100% autocall barrier
    {
      id: 'decision-3',
      variant: 'neutral',
      column: 2,
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
      column: 3,
      label: 'Early Redemption +\n8.68% coupon',
      connections: [], // Terminal - no next
    },

    // Decision 4: 80% coupon barrier
    {
      id: 'decision-4',
      variant: 'neutral',
      column: 2,
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
      column: 3,
      label: 'Payment of 8.68%\ncoupon (3 monthly)',
      connections: [{ targetId: 'period-4' }],
    },

    // Period 4
    {
      id: 'period-4',
      variant: 'primary',
      column: 1,
      label: 'Period 4\n(Maturity\nDate)',
      connections: [{ targetId: 'decision-5' }],
    },

    // Decision 5: Final decision
    {
      id: 'decision-5',
      variant: 'neutral',
      column: 2,
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
      column: 3,
      label: '100% of Capital + 8.68%\ncoupon',
      connections: [],
    },

    {
      id: 'outcome-final-no',
      variant: 'secondary',
      column: 3,
      label: 'Investor receives the\nperformance of the worst\nperforming underlying',
      connections: [],
    },
  ],
};

// ============================================================================
// EXAMPLE 2: Computer Troubleshooting
// ============================================================================
// Based on real-world IT support troubleshooting flowcharts
const example2_ComputerTroubleshooting: FlowChartData = {
  rootId: 'start',
  nodes: [
    {
      id: 'start',
      variant: 'primary',
      column: 1,
      label: "Computer\nWon't Start",
      connections: [{ targetId: 'power-connected' }],
    },
    {
      id: 'power-connected',
      variant: 'neutral',
      column: 2,
      label: 'Is power cable\nconnected?',
      connections: [
        { targetId: 'lights-on', label: 'Yes', color: 'green' },
        { targetId: 'plug-in', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'plug-in',
      variant: 'secondary',
      column: 3,
      label: 'Plug in\npower cable',
      connections: [{ targetId: 'power-connected', label: 'Retry', color: 'blue' }],
    },
    {
      id: 'lights-on',
      variant: 'neutral',
      column: 2,
      label: 'Are indicator\nlights on?',
      connections: [
        { targetId: 'display-check', label: 'Yes', color: 'green' },
        { targetId: 'power-supply', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'power-supply',
      variant: 'secondary',
      column: 3,
      label: 'Check power supply\n& outlets',
      connections: [{ targetId: 'lights-on', label: 'Retry', color: 'blue' }],
    },
    {
      id: 'display-check',
      variant: 'neutral',
      column: 2,
      label: 'Does display\nshow anything?',
      connections: [
        { targetId: 'boot-sequence', label: 'Yes', color: 'green' },
        { targetId: 'monitor-check', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'monitor-check',
      variant: 'secondary',
      column: 3,
      label: 'Check monitor\nconnections',
      connections: [{ targetId: 'display-check', label: 'Retry', color: 'blue' }],
    },
    {
      id: 'boot-sequence',
      variant: 'neutral',
      column: 1,
      label: 'Does it boot\nto OS?',
      connections: [
        { targetId: 'resolved', label: 'Yes', color: 'green' },
        { targetId: 'safe-mode', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'safe-mode',
      variant: 'secondary',
      column: 2,
      label: 'Try booting in\nSafe Mode',
      connections: [
        { targetId: 'resolved', label: 'Works', color: 'green' },
        { targetId: 'hardware-failure', label: 'Fails', color: 'red' },
      ],
    },
    {
      id: 'hardware-failure',
      variant: 'secondary',
      column: 3,
      label: 'Likely hardware\nfailure - contact IT',
      connections: [],
    },
    {
      id: 'resolved',
      variant: 'primary',
      column: 3,
      label: 'Problem\nResolved!',
      connections: [],
    },
  ],
};

// ============================================================================
// EXAMPLE 3: Medical Emergency Response
// ============================================================================
// Based on EMT assessment and emergency response protocols
const example3_MedicalEmergency: FlowChartData = {
  rootId: 'scene-arrival',
  nodes: [
    {
      id: 'scene-arrival',
      variant: 'primary',
      column: 1,
      label: 'Arrive at\nScene',
      connections: [{ targetId: 'scene-safe' }],
    },
    {
      id: 'scene-safe',
      variant: 'neutral',
      column: 2,
      label: 'Is scene\nsafe?',
      connections: [
        { targetId: 'assess-consciousness', label: 'Yes', color: 'green' },
        { targetId: 'secure-scene', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'secure-scene',
      variant: 'secondary',
      column: 3,
      label: 'Secure scene\nwait for backup',
      connections: [{ targetId: 'scene-safe', label: 'Retry', color: 'blue' }],
    },
    {
      id: 'assess-consciousness',
      variant: 'neutral',
      column: 2,
      label: 'Patient\nconscious?',
      connections: [
        { targetId: 'breathing-check', label: 'Yes', color: 'green' },
        { targetId: 'check-airway', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'check-airway',
      variant: 'secondary',
      column: 3,
      label: 'Open airway\ncheck breathing',
      connections: [{ targetId: 'breathing-check' }],
    },
    {
      id: 'breathing-check',
      variant: 'neutral',
      column: 1,
      label: 'Breathing\nnormally?',
      connections: [
        { targetId: 'circulation-check', label: 'Yes', color: 'green' },
        { targetId: 'assist-breathing', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'assist-breathing',
      variant: 'secondary',
      column: 2,
      label: 'Provide rescue\nbreathing/CPR',
      connections: [{ targetId: 'call-als', color: 'red' }],
    },
    {
      id: 'circulation-check',
      variant: 'neutral',
      column: 2,
      label: 'Severe bleeding\nor shock?',
      connections: [
        { targetId: 'vital-signs', label: 'No', color: 'green' },
        { targetId: 'control-bleeding', label: 'Yes', color: 'red' },
      ],
    },
    {
      id: 'control-bleeding',
      variant: 'secondary',
      column: 3,
      label: 'Control bleeding\ntreat for shock',
      connections: [{ targetId: 'call-als', color: 'red' }],
    },
    {
      id: 'vital-signs',
      variant: 'neutral',
      column: 2,
      label: 'Vital signs\nstable?',
      connections: [
        { targetId: 'transport-routine', label: 'Yes', color: 'green' },
        { targetId: 'call-als', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'call-als',
      variant: 'primary',
      column: 1,
      label: 'Call ALS\nEmergency Transport',
      connections: [],
    },
    {
      id: 'transport-routine',
      variant: 'primary',
      column: 3,
      label: 'Routine\nTransport to Hospital',
      connections: [],
    },
  ],
};

// ============================================================================
// EXAMPLE 4: Customer Complaint Escalation
// ============================================================================
// Based on standard customer service escalation protocols
const example4_ComplaintEscalation: FlowChartData = {
  rootId: 'complaint-received',
  nodes: [
    {
      id: 'complaint-received',
      variant: 'primary',
      column: 1,
      label: 'Complaint\nReceived',
      connections: [{ targetId: 'log-complaint' }],
    },
    {
      id: 'log-complaint',
      variant: 'neutral',
      column: 2,
      label: 'Log complaint\n& assess severity',
      connections: [{ targetId: 'severity-check' }],
    },
    {
      id: 'severity-check',
      variant: 'neutral',
      column: 2,
      label: 'Severity\nLevel?',
      connections: [
        { targetId: 'critical-escalate', label: 'Critical', color: 'red' },
        { targetId: 'high-assign', label: 'High', color: 'orange' },
        { targetId: 'front-desk', label: 'Normal', color: 'blue' },
      ],
    },
    {
      id: 'front-desk',
      variant: 'secondary',
      column: 3,
      label: 'Front Desk\nAgent Handles',
      connections: [{ targetId: 'agent-resolve' }],
    },
    {
      id: 'agent-resolve',
      variant: 'neutral',
      column: 1,
      label: 'Agent able\nto resolve?',
      connections: [
        { targetId: 'update-customer', label: 'Yes', color: 'green' },
        { targetId: 'escalate-supervisor', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'high-assign',
      variant: 'secondary',
      column: 3,
      label: 'Assign to\nSenior Agent',
      connections: [{ targetId: 'senior-resolve' }],
    },
    {
      id: 'senior-resolve',
      variant: 'neutral',
      column: 1,
      label: 'Senior agent\nresolves?',
      connections: [
        { targetId: 'update-customer', label: 'Yes', color: 'green' },
        { targetId: 'escalate-supervisor', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'escalate-supervisor',
      variant: 'secondary',
      column: 2,
      label: 'Escalate to\nSupervisor',
      connections: [{ targetId: 'supervisor-resolve' }],
    },
    {
      id: 'supervisor-resolve',
      variant: 'neutral',
      column: 2,
      label: 'Supervisor\nresolves?',
      connections: [
        { targetId: 'update-customer', label: 'Yes', color: 'green' },
        { targetId: 'escalate-manager', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'critical-escalate',
      variant: 'secondary',
      column: 3,
      label: 'Immediate\nManager Escalation',
      connections: [{ targetId: 'escalate-manager' }],
    },
    {
      id: 'escalate-manager',
      variant: 'primary',
      column: 1,
      label: 'Manager\nFinal Decision',
      connections: [{ targetId: 'update-customer' }],
    },
    {
      id: 'update-customer',
      variant: 'primary',
      column: 3,
      label: 'Update Customer\n& Close Ticket',
      connections: [],
    },
  ],
};

// ============================================================================
// EXAMPLE 5: Password Reset Flow
// ============================================================================
// Common IT support scenario for account recovery
const example5_PasswordReset: FlowChartData = {
  rootId: 'forgot-password',
  nodes: [
    {
      id: 'forgot-password',
      variant: 'primary',
      column: 1,
      label: 'User Forgot\nPassword',
      connections: [{ targetId: 'enter-email' }],
    },
    {
      id: 'enter-email',
      variant: 'neutral',
      column: 2,
      label: 'Enter email\naddress',
      connections: [{ targetId: 'email-exists' }],
    },
    {
      id: 'email-exists',
      variant: 'neutral',
      column: 2,
      label: 'Email in\nsystem?',
      connections: [
        { targetId: 'verify-identity', label: 'Yes', color: 'green' },
        { targetId: 'email-not-found', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'email-not-found',
      variant: 'secondary',
      column: 3,
      label: 'Email not found\ntry again',
      connections: [{ targetId: 'enter-email', label: 'Retry', color: 'blue' }],
    },
    {
      id: 'verify-identity',
      variant: 'neutral',
      column: 2,
      label: 'Choose verification:\nSMS or Security Questions?',
      connections: [
        { targetId: 'send-sms', label: 'SMS', color: 'blue' },
        { targetId: 'security-questions', label: 'Questions', color: 'orange' },
      ],
    },
    {
      id: 'send-sms',
      variant: 'secondary',
      column: 3,
      label: 'Send code\nvia SMS',
      connections: [{ targetId: 'verify-code' }],
    },
    {
      id: 'verify-code',
      variant: 'neutral',
      column: 1,
      label: 'Code\nvalid?',
      connections: [
        { targetId: 'reset-password', label: 'Yes', color: 'green' },
        { targetId: 'code-invalid', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'code-invalid',
      variant: 'secondary',
      column: 2,
      label: 'Invalid code',
      connections: [
        { targetId: 'verify-code', label: 'Retry', color: 'blue' },
        { targetId: 'contact-support', label: 'Too many tries', color: 'red' },
      ],
    },
    {
      id: 'security-questions',
      variant: 'secondary',
      column: 3,
      label: 'Answer security\nquestions',
      connections: [{ targetId: 'answers-correct' }],
    },
    {
      id: 'answers-correct',
      variant: 'neutral',
      column: 1,
      label: 'Answers\ncorrect?',
      connections: [
        { targetId: 'reset-password', label: 'Yes', color: 'green' },
        { targetId: 'answers-wrong', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'answers-wrong',
      variant: 'secondary',
      column: 2,
      label: 'Incorrect answers',
      connections: [
        { targetId: 'security-questions', label: 'Retry', color: 'blue' },
        { targetId: 'contact-support', label: 'Too many tries', color: 'red' },
      ],
    },
    {
      id: 'reset-password',
      variant: 'primary',
      column: 2,
      label: 'Enter new\npassword',
      connections: [{ targetId: 'password-valid' }],
    },
    {
      id: 'password-valid',
      variant: 'neutral',
      column: 2,
      label: 'Password meets\nrequirements?',
      connections: [
        { targetId: 'success', label: 'Yes', color: 'green' },
        { targetId: 'password-weak', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'password-weak',
      variant: 'secondary',
      column: 3,
      label: 'Password too weak',
      connections: [{ targetId: 'reset-password', label: 'Try again', color: 'blue' }],
    },
    {
      id: 'contact-support',
      variant: 'primary',
      column: 3,
      label: 'Contact\nSupport Team',
      connections: [],
    },
    {
      id: 'success',
      variant: 'primary',
      column: 3,
      label: 'Password Reset\nSuccessful!',
      connections: [],
    },
  ],
};

// ============================================================================
// EXAMPLE 6: Printer Troubleshooting
// ============================================================================
// Based on common printer issue resolution steps
const example6_PrinterTroubleshooting: FlowChartData = {
  rootId: 'printer-issue',
  nodes: [
    {
      id: 'printer-issue',
      variant: 'primary',
      column: 1,
      label: "Printer Won't\nPrint",
      connections: [{ targetId: 'power-on' }],
    },
    {
      id: 'power-on',
      variant: 'neutral',
      column: 2,
      label: 'Printer\npowered on?',
      connections: [
        { targetId: 'check-errors', label: 'Yes', color: 'green' },
        { targetId: 'turn-on', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'turn-on',
      variant: 'secondary',
      column: 3,
      label: 'Turn on\nprinter',
      connections: [{ targetId: 'power-on', label: 'Retry', color: 'blue' }],
    },
    {
      id: 'check-errors',
      variant: 'neutral',
      column: 2,
      label: 'Error messages\ndisplayed?',
      connections: [
        { targetId: 'check-connection', label: 'No', color: 'green' },
        { targetId: 'resolve-error', label: 'Yes', color: 'red' },
      ],
    },
    {
      id: 'resolve-error',
      variant: 'secondary',
      column: 3,
      label: 'Clear paper jam\nor error',
      connections: [{ targetId: 'check-errors', label: 'Retry', color: 'blue' }],
    },
    {
      id: 'check-connection',
      variant: 'neutral',
      column: 1,
      label: 'Connected to\ncomputer/network?',
      connections: [
        { targetId: 'check-queue', label: 'Yes', color: 'green' },
        { targetId: 'reconnect', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'reconnect',
      variant: 'secondary',
      column: 2,
      label: 'Check cables\nor WiFi',
      connections: [{ targetId: 'check-connection', label: 'Retry', color: 'blue' }],
    },
    {
      id: 'check-queue',
      variant: 'neutral',
      column: 2,
      label: 'Jobs stuck in\nprint queue?',
      connections: [
        { targetId: 'check-supplies', label: 'No', color: 'green' },
        { targetId: 'clear-queue', label: 'Yes', color: 'red' },
      ],
    },
    {
      id: 'clear-queue',
      variant: 'secondary',
      column: 3,
      label: 'Clear print\nqueue',
      connections: [{ targetId: 'test-print' }],
    },
    {
      id: 'check-supplies',
      variant: 'neutral',
      column: 2,
      label: 'Paper & ink\navailable?',
      connections: [
        { targetId: 'test-print', label: 'Yes', color: 'green' },
        { targetId: 'add-supplies', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'add-supplies',
      variant: 'secondary',
      column: 3,
      label: 'Add paper\nor replace ink',
      connections: [{ targetId: 'test-print' }],
    },
    {
      id: 'test-print',
      variant: 'neutral',
      column: 1,
      label: 'Test print\nsucceeds?',
      connections: [
        { targetId: 'resolved', label: 'Yes', color: 'green' },
        { targetId: 'driver-check', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'driver-check',
      variant: 'secondary',
      column: 2,
      label: 'Reinstall printer\ndrivers',
      connections: [
        { targetId: 'resolved', label: 'Works', color: 'green' },
        { targetId: 'contact-it', label: 'Fails', color: 'red' },
      ],
    },
    {
      id: 'contact-it',
      variant: 'primary',
      column: 3,
      label: 'Contact IT\nSupport',
      connections: [],
    },
    {
      id: 'resolved',
      variant: 'primary',
      column: 3,
      label: 'Printer\nWorking!',
      connections: [],
    },
  ],
};

// ============================================================================
// EXAMPLE 7: Online Order Fulfillment
// ============================================================================
// E-commerce order processing workflow
const example7_OrderFulfillment: FlowChartData = {
  rootId: 'order-received',
  nodes: [
    {
      id: 'order-received',
      variant: 'primary',
      column: 1,
      label: 'Order\nReceived',
      connections: [{ targetId: 'payment-check' }],
    },
    {
      id: 'payment-check',
      variant: 'neutral',
      column: 2,
      label: 'Payment\nverified?',
      connections: [
        { targetId: 'inventory-check', label: 'Yes', color: 'green' },
        { targetId: 'payment-issue', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'payment-issue',
      variant: 'secondary',
      column: 3,
      label: 'Contact customer\nfor payment',
      connections: [
        { targetId: 'payment-check', label: 'Resolved', color: 'green' },
        { targetId: 'cancel-order', label: 'Failed', color: 'red' },
      ],
    },
    {
      id: 'inventory-check',
      variant: 'neutral',
      column: 2,
      label: 'All items\nin stock?',
      connections: [
        { targetId: 'pick-pack', label: 'Yes', color: 'green' },
        { targetId: 'partial-stock', label: 'Partial', color: 'orange' },
        { targetId: 'out-of-stock', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'partial-stock',
      variant: 'secondary',
      column: 3,
      label: 'Contact customer\nfor options',
      connections: [
        { targetId: 'pick-pack', label: 'Ship available', color: 'green' },
        { targetId: 'cancel-order', label: 'Cancel', color: 'red' },
      ],
    },
    {
      id: 'out-of-stock',
      variant: 'secondary',
      column: 3,
      label: 'Notify customer\nof backorder',
      connections: [
        { targetId: 'inventory-check', label: 'Wait', color: 'blue' },
        { targetId: 'cancel-order', label: 'Cancel', color: 'red' },
      ],
    },
    {
      id: 'pick-pack',
      variant: 'primary',
      column: 1,
      label: 'Pick & Pack\nItems',
      connections: [{ targetId: 'quality-check' }],
    },
    {
      id: 'quality-check',
      variant: 'neutral',
      column: 2,
      label: 'Quality check\npassed?',
      connections: [
        { targetId: 'print-label', label: 'Yes', color: 'green' },
        { targetId: 'pick-pack', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'print-label',
      variant: 'secondary',
      column: 3,
      label: 'Print shipping\nlabel',
      connections: [{ targetId: 'ship-order' }],
    },
    {
      id: 'ship-order',
      variant: 'primary',
      column: 1,
      label: 'Ship via\nCarrier',
      connections: [{ targetId: 'notify-customer' }],
    },
    {
      id: 'notify-customer',
      variant: 'secondary',
      column: 2,
      label: 'Send tracking\ninfo to customer',
      connections: [{ targetId: 'delivered' }],
    },
    {
      id: 'delivered',
      variant: 'primary',
      column: 3,
      label: 'Order\nDelivered',
      connections: [],
    },
    {
      id: 'cancel-order',
      variant: 'primary',
      column: 3,
      label: 'Order\nCancelled',
      connections: [],
    },
  ],
};

// ============================================================================
// EXAMPLE 8: Network Connection Troubleshooting
// ============================================================================
// Common network connectivity issue resolution
const example8_NetworkTroubleshooting: FlowChartData = {
  rootId: 'no-internet',
  nodes: [
    {
      id: 'no-internet',
      variant: 'primary',
      column: 1,
      label: 'No Internet\nConnection',
      connections: [{ targetId: 'other-devices' }],
    },
    {
      id: 'other-devices',
      variant: 'neutral',
      column: 2,
      label: 'Other devices\nconnected?',
      connections: [
        { targetId: 'device-issue', label: 'Yes', color: 'green' },
        { targetId: 'router-check', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'router-check',
      variant: 'neutral',
      column: 3,
      label: 'Router lights\nnormal?',
      connections: [
        { targetId: 'modem-check', label: 'Yes', color: 'green' },
        { targetId: 'restart-router', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'restart-router',
      variant: 'secondary',
      column: 3,
      label: 'Restart\nrouter',
      connections: [{ targetId: 'router-check', label: 'Retry', color: 'blue' }],
    },
    {
      id: 'modem-check',
      variant: 'neutral',
      column: 1,
      label: 'Modem\nonline?',
      connections: [
        { targetId: 'cable-check', label: 'Yes', color: 'green' },
        { targetId: 'restart-modem', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'restart-modem',
      variant: 'secondary',
      column: 2,
      label: 'Restart\nmodem',
      connections: [{ targetId: 'modem-check', label: 'Retry', color: 'blue' }],
    },
    {
      id: 'cable-check',
      variant: 'neutral',
      column: 2,
      label: 'All cables\nconnected?',
      connections: [
        { targetId: 'test-connection', label: 'Yes', color: 'green' },
        { targetId: 'reconnect-cables', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'reconnect-cables',
      variant: 'secondary',
      column: 3,
      label: 'Reconnect\ncables',
      connections: [{ targetId: 'test-connection' }],
    },
    {
      id: 'device-issue',
      variant: 'neutral',
      column: 3,
      label: 'WiFi enabled\non device?',
      connections: [
        { targetId: 'forget-network', label: 'Yes', color: 'green' },
        { targetId: 'enable-wifi', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'enable-wifi',
      variant: 'secondary',
      column: 3,
      label: 'Enable\nWiFi',
      connections: [{ targetId: 'device-issue', label: 'Retry', color: 'blue' }],
    },
    {
      id: 'forget-network',
      variant: 'secondary',
      column: 1,
      label: 'Forget & reconnect\nto network',
      connections: [{ targetId: 'test-connection' }],
    },
    {
      id: 'test-connection',
      variant: 'neutral',
      column: 2,
      label: 'Connection\nworking?',
      connections: [
        { targetId: 'connected', label: 'Yes', color: 'green' },
        { targetId: 'contact-isp', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'contact-isp',
      variant: 'primary',
      column: 3,
      label: 'Contact Internet\nService Provider',
      connections: [],
    },
    {
      id: 'connected',
      variant: 'primary',
      column: 3,
      label: 'Connected!',
      connections: [],
    },
  ],
};

// ============================================================================
// EXAMPLE 9: Job Application Screening
// ============================================================================
// HR recruitment and applicant screening process
const example9_JobApplication: FlowChartData = {
  rootId: 'application-received',
  nodes: [
    {
      id: 'application-received',
      variant: 'primary',
      column: 1,
      label: 'Application\nReceived',
      connections: [{ targetId: 'initial-review' }],
    },
    {
      id: 'initial-review',
      variant: 'neutral',
      column: 2,
      label: 'Resume meets\nminimum requirements?',
      connections: [
        { targetId: 'experience-check', label: 'Yes', color: 'green' },
        { targetId: 'reject-initial', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'experience-check',
      variant: 'neutral',
      column: 2,
      label: 'Required experience\n& skills?',
      connections: [
        { targetId: 'phone-screen', label: 'Yes', color: 'green' },
        { targetId: 'borderline', label: 'Partial', color: 'orange' },
        { targetId: 'reject-initial', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'borderline',
      variant: 'secondary',
      column: 3,
      label: 'Review with\nhiring manager',
      connections: [
        { targetId: 'phone-screen', label: 'Approve', color: 'green' },
        { targetId: 'reject-initial', label: 'Decline', color: 'red' },
      ],
    },
    {
      id: 'phone-screen',
      variant: 'primary',
      column: 1,
      label: 'Phone\nScreen',
      connections: [{ targetId: 'phone-result' }],
    },
    {
      id: 'phone-result',
      variant: 'neutral',
      column: 2,
      label: 'Phone screen\nsuccessful?',
      connections: [
        { targetId: 'technical-test', label: 'Yes', color: 'green' },
        { targetId: 'reject-phone', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'technical-test',
      variant: 'secondary',
      column: 3,
      label: 'Technical\nAssessment',
      connections: [{ targetId: 'test-result' }],
    },
    {
      id: 'test-result',
      variant: 'neutral',
      column: 1,
      label: 'Assessment\npassed?',
      connections: [
        { targetId: 'onsite-interview', label: 'Yes', color: 'green' },
        { targetId: 'reject-test', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'onsite-interview',
      variant: 'primary',
      column: 2,
      label: 'Onsite/Virtual\nInterview',
      connections: [{ targetId: 'team-feedback' }],
    },
    {
      id: 'team-feedback',
      variant: 'neutral',
      column: 2,
      label: 'Team consensus\nto hire?',
      connections: [
        { targetId: 'reference-check', label: 'Yes', color: 'green' },
        { targetId: 'reject-interview', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'reference-check',
      variant: 'secondary',
      column: 3,
      label: 'Check\nReferences',
      connections: [{ targetId: 'references-ok' }],
    },
    {
      id: 'references-ok',
      variant: 'neutral',
      column: 1,
      label: 'References\nsatisfactory?',
      connections: [
        { targetId: 'make-offer', label: 'Yes', color: 'green' },
        { targetId: 'reject-references', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'make-offer',
      variant: 'primary',
      column: 2,
      label: 'Extend Job\nOffer',
      connections: [{ targetId: 'offer-response' }],
    },
    {
      id: 'offer-response',
      variant: 'neutral',
      column: 2,
      label: 'Offer\naccepted?',
      connections: [
        { targetId: 'hired', label: 'Yes', color: 'green' },
        { targetId: 'offer-declined', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'hired',
      variant: 'primary',
      column: 3,
      label: 'Candidate\nHired!',
      connections: [],
    },
    {
      id: 'reject-initial',
      variant: 'secondary',
      column: 3,
      label: 'Send rejection\n(initial screening)',
      connections: [],
    },
    {
      id: 'reject-phone',
      variant: 'secondary',
      column: 3,
      label: 'Send rejection\n(after phone screen)',
      connections: [],
    },
    {
      id: 'reject-test',
      variant: 'secondary',
      column: 2,
      label: 'Send rejection\n(after assessment)',
      connections: [],
    },
    {
      id: 'reject-interview',
      variant: 'secondary',
      column: 3,
      label: 'Send rejection\n(after interview)',
      connections: [],
    },
    {
      id: 'reject-references',
      variant: 'secondary',
      column: 2,
      label: 'Send rejection\n(references)',
      connections: [],
    },
    {
      id: 'offer-declined',
      variant: 'secondary',
      column: 3,
      label: 'Offer\nDeclined',
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
    id: 'computer-troubleshooting',
    name: 'Computer Troubleshooting',
    description: 'IT support workflow for diagnosing and fixing computer startup issues',
    data: example2_ComputerTroubleshooting,
    hasActivePath: true,
    maxWidth: 900,
    scale: 1,
  },
  {
    id: 'medical-emergency',
    name: 'Medical Emergency Response',
    description: 'EMT assessment protocol for emergency medical situations',
    data: example3_MedicalEmergency,
    hasActivePath: true,
    maxWidth: 900,
    scale: 1,
  },
  {
    id: 'complaint-escalation',
    name: 'Customer Complaint Escalation',
    description: 'Multi-tier customer service escalation with severity routing',
    data: example4_ComplaintEscalation,
    hasActivePath: true,
    maxWidth: 900,
    scale: 1,
  },
  {
    id: 'password-reset',
    name: 'Password Reset Flow',
    description: 'Account recovery with SMS/security questions and retry limits',
    data: example5_PasswordReset,
    hasActivePath: true,
    maxWidth: 900,
    scale: 1,
  },
  {
    id: 'printer-troubleshooting',
    name: 'Printer Troubleshooting',
    description: 'Systematic printer diagnosis from power to driver issues',
    data: example6_PrinterTroubleshooting,
    hasActivePath: true,
    maxWidth: 900,
    scale: 1,
  },
  {
    id: 'order-fulfillment',
    name: 'Online Order Fulfillment',
    description: 'E-commerce order processing from payment to delivery',
    data: example7_OrderFulfillment,
    hasActivePath: true,
    maxWidth: 900,
    scale: 1,
  },
  {
    id: 'network-troubleshooting',
    name: 'Network Connection Troubleshooting',
    description: 'Internet connectivity diagnostics for home/office networks',
    data: example8_NetworkTroubleshooting,
    hasActivePath: true,
    maxWidth: 900,
    scale: 1,
  },
  {
    id: 'job-application',
    name: 'Job Application Screening',
    description: 'HR recruitment process from resume review to job offer',
    data: example9_JobApplication,
    hasActivePath: true,
    maxWidth: 900,
    scale: 1,
  },
];

export function FlowChartV2Demo() {
  const [selectedExample, setSelectedExample] = React.useState<string>('financial');
  const [showActivePath, setShowActivePath] = React.useState(false);
  const [userScale, setUserScale] = React.useState<number>(1);

  const currentExample = examples.find((ex) => ex.id === selectedExample) || examples[0];

  // Create data with active path for examples that support it
  const getDisplayData = (): FlowChartData => {
    if (!showActivePath || !currentExample.hasActivePath) {
      return currentExample.data;
    }

    // Define active paths for each example
    const activePathsMap: Record<string, string[]> = {
      financial: [
        'period-1',
        'decision-1',
        'decision-2',
        'period-2-3',
        'decision-3',
        'decision-4',
        'outcome-payment-2',
      ],
      'computer-troubleshooting': [
        'start',
        'power-connected',
        'lights-on',
        'display-check',
        'boot-sequence',
        'resolved',
      ],
      'medical-emergency': [
        'scene-arrival',
        'scene-safe',
        'assess-consciousness',
        'breathing-check',
        'circulation-check',
        'vital-signs',
        'transport-routine',
      ],
      'complaint-escalation': [
        'complaint-received',
        'log-complaint',
        'severity-check',
        'high-assign',
        'senior-resolve',
        'update-customer',
      ],
      'password-reset': [
        'forgot-password',
        'enter-email',
        'email-exists',
        'verify-identity',
        'send-sms',
        'verify-code',
        'reset-password',
        'password-valid',
        'success',
      ],
      'printer-troubleshooting': [
        'printer-issue',
        'power-on',
        'check-errors',
        'check-connection',
        'check-queue',
        'check-supplies',
        'test-print',
        'resolved',
      ],
      'order-fulfillment': [
        'order-received',
        'payment-check',
        'inventory-check',
        'pick-pack',
        'quality-check',
        'print-label',
        'ship-order',
        'notify-customer',
        'delivered',
      ],
      'network-troubleshooting': [
        'no-internet',
        'other-devices',
        'router-check',
        'modem-check',
        'cable-check',
        'test-connection',
        'connected',
      ],
      'job-application': [
        'application-received',
        'initial-review',
        'experience-check',
        'phone-screen',
        'phone-result',
        'technical-test',
        'test-result',
        'onsite-interview',
        'team-feedback',
        'reference-check',
        'references-ok',
        'make-offer',
        'offer-response',
        'hired',
      ],
    };

    const activeNodeIds = activePathsMap[selectedExample] || [];

    return {
      ...currentExample.data,
      nodes: currentExample.data.nodes.map((node) => ({
        ...node,
        isActive: activeNodeIds.includes(node.id),
      })),
    };
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

        {/* Scale Slider */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#1e3a5f',
            }}
          >
            Scale: {userScale.toFixed(2)}x
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#666', fontSize: '14px', minWidth: '40px' }}>0.5x</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={userScale}
              onChange={(e) => setUserScale(parseFloat(e.target.value))}
              style={{
                flex: 1,
                height: '6px',
                borderRadius: '3px',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <span style={{ color: '#666', fontSize: '14px', minWidth: '40px' }}>2.0x</span>
          </div>
          <p style={{ marginTop: '8px', color: '#666', fontSize: '12px', fontStyle: 'italic' }}>
            Adjust the scale to zoom in or out on the flowchart
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
          <FlowChartV2
            data={displayData}
            title={currentExample.name}
            subtitle={currentExample.description}
            maxWidth={currentExample.maxWidth}
            scale={userScale}
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
