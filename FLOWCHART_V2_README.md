# FlowChart V2 - Technical Documentation

A comprehensive guide to understanding, modifying, and extending the FlowChartV2 component.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [Core Concepts](#core-concepts)
4. [Type System](#type-system)
5. [Layout Algorithm](#layout-algorithm)
6. [Rendering Logic](#rendering-logic)
7. [Arrow Routing](#arrow-routing)
8. [Collision Avoidance](#collision-avoidance)
9. [Visual Features](#visual-features)
10. [Extension Guide](#extension-guide)

---

## Architecture Overview

FlowChartV2 is a declarative flowchart rendering system built on three main pillars:

```
┌─────────────────┐
│  Data Structure │ → Flat array of nodes with ID references
│  (types.ts)     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Layout Engine   │ → Calculates node positions and connections
│ (layoutEngine)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ React Component │ → Renders SVG with nodes and arrows
│ (FlowChartV2)   │
└─────────────────┘
```

### Key Design Principles

1. **Separation of Concerns**: Data structure, layout calculation, and rendering are completely decoupled
2. **Declarative API**: Users define "what" the flowchart should look like, not "how" to render it
3. **Collision-Free Routing**: Arrows automatically route around nodes to avoid visual overlap
4. **Flexible Positioning**: Supports both default column-based layout and explicit positioning

---

## File Structure

```
src/components/FlowChartV2/
├── types.ts              # TypeScript type definitions
├── layoutEngine.ts       # Position calculation logic
├── FlowChartV2.tsx       # Main React component (SVG rendering)
├── Node.tsx              # Individual node rendering component
└── index.ts              # Public exports
```

### File Responsibilities

| File | Purpose | Key Exports |
|------|---------|-------------|
| `types.ts` | Type definitions for all data structures | `FlowNode`, `FlowChartData`, `Connection`, `PositionedNode` |
| `layoutEngine.ts` | Calculates x/y positions for nodes and routing | `calculateLayout()` |
| `FlowChartV2.tsx` | SVG rendering, arrow drawing, collision detection | `FlowChartV2` component |
| `Node.tsx` | Renders individual node rectangles | `Node` component |

---

## Core Concepts

### 1. Node Variants

Nodes come in three visual variants that control their appearance:

```typescript
type NodeVariant = 'primary' | 'neutral' | 'secondary';
```

**Visual Characteristics:**

- **`primary`**: Dark blue background (#1e3a5f), white text - Used for major stages/periods
- **`neutral`**: White background, dark text, blue border - Used for decision points
- **`secondary`**: Light blue background (#e3f2fd), dark text - Used for outcomes/results

**Important**: Variant controls ONLY styling, not positioning.

### 2. Column Positioning

Nodes are organized into vertical columns for clean left-to-right flow:

```typescript
const COLUMN_X_POSITIONS = {
  1: 50,      // Left column (default for primary)
  2: 300,     // Middle column (default for neutral)
  3: 550,     // Right column (default for secondary)
};
```

**Column Assignment Logic:**
1. If node has explicit `column` property → use that column
2. Otherwise, use default based on variant (primary=1, neutral=2, secondary=3)
3. Custom columns (4, 5, etc.) are supported and auto-calculated if not defined

### 3. Connections Array

Each node has a `connections` array that defines outgoing arrows:

```typescript
connections: [
  { targetId: 'node-2', label: 'Yes', color: 'green' },
  { targetId: 'node-3', label: 'No', color: 'red' },
]
```

**Connection Properties:**
- `targetId` (required): ID of destination node
- `label` (optional): Text shown on arrow (e.g., "Yes", "No", "Retry")
- `color` (optional): Arrow color - 'green', 'red', 'blue', 'orange', or 'default'

---

## Type System

### FlowNode (Input Type)

This is what users define - the logical structure of the flowchart:

```typescript
interface FlowNode {
  id: string;                      // Unique identifier
  variant: NodeVariant;            // Visual style
  label: string;                   // Display text (supports \n for newlines)
  column?: number;                 // Optional column override
  isActive?: boolean;              // Highlight this node on active path
  connections: NodeConnection[];   // Outgoing arrows
}
```

**Example:**
```typescript
{
  id: 'decision-1',
  variant: 'neutral',
  label: 'User\nAuthenticated?',
  column: 2,
  isActive: true,
  connections: [
    { targetId: 'dashboard', label: 'Yes', color: 'green' },
    { targetId: 'login', label: 'No', color: 'red' }
  ]
}
```

### PositionedNode (Layout Output)

After layout calculation, nodes become positioned nodes with x/y coordinates:

```typescript
interface PositionedNode {
  node: FlowNode;       // Original node data
  x: number;            // Left edge position
  y: number;            // Top edge position
  width: number;        // Node width (always 180px * scale)
  height: number;       // Node height (always 70px * scale)
}
```

### Connection (Rendering Data)

Connections are transformed into full routing information:

```typescript
interface Connection {
  from: PositionedNode;                              // Source node
  to: PositionedNode;                                // Destination node
  label?: string;                                    // Arrow label
  color?: ConnectionColor;                           // Arrow color
  fromSide: 'top' | 'right' | 'bottom' | 'left';    // Exit side
  toSide: 'top' | 'right' | 'bottom' | 'left';      // Entry side
  isActive?: boolean;                                // Active path indicator
}
```

---

## Layout Algorithm

The layout engine (`layoutEngine.ts`) is responsible for calculating positions and routing.

### High-Level Flow

```typescript
function calculateLayout(chartData: FlowChartData): LayoutResult {
  // 1. Initialize data structures
  const nodes: PositionedNode[] = [];
  const connections: Connection[] = [];
  const nodeMap = new Map<string, PositionedNode>();
  const visited = new Set<string>();

  // 2. Recursively position nodes starting from root
  layoutNode(chartData.rootId, startX, startY);

  // 3. Return positioned nodes and connections
  return { nodes, connections, width, height };
}
```

### Node Positioning Algorithm

**Step-by-step process for each node:**

```typescript
function layoutNode(nodeId, x, y, parentNode?, connection?) {
  // 1. Check if already visited (handle convergence)
  if (visited.has(nodeId)) {
    // Just create connection to existing node
    createConnection(parentNode, existingNode, connection);
    return;
  }

  // 2. Calculate node dimensions based on variant
  const { width, height } = getNodeDimensions(node);

  // 3. Determine column X position
  const columnX = getNodeColumn(node);

  // 4. Check for collision and adjust Y if needed
  const { finalX, finalY } = findAvailablePosition(columnX, y, width, height);

  // 5. Create positioned node
  const positioned = { node, x: finalX, y: finalY, width, height };
  nodes.push(positioned);
  nodeMap.set(node.id, positioned);

  // 6. Create connection from parent
  if (parentNode) {
    connections.push({
      from: parentNode,
      to: positioned,
      fromSide: calculateExitSide(),
      toSide: calculateEntrySide(),
      isActive: parentNode.isActive && positioned.isActive
    });
  }

  // 7. Recursively position children
  node.connections.forEach((conn) => {
    const targetColumn = getNodeColumn(targetNode);
    const targetY = calculateTargetY(positioned, targetNode);
    layoutNode(conn.targetId, targetColumn, targetY, positioned, conn);
  });
}
```

### Collision Detection

The layout engine prevents nodes from overlapping:

```typescript
function hasCollision(x, y, width, height): boolean {
  const buffer = 15; // Minimum 15px spacing

  for (const existingNode of nodes) {
    // Check if rectangles overlap
    const noOverlapX =
      x + width + buffer <= existingNode.x ||
      existingNode.x + existingNode.width + buffer <= x;

    const noOverlapY =
      y + height + buffer <= existingNode.y ||
      existingNode.y + existingNode.height + buffer <= y;

    if (!noOverlapX && !noOverlapY) {
      return true; // Collision detected
    }
  }

  return false;
}
```

**Collision Resolution:**
```typescript
function findAvailablePosition(x, y, width, height) {
  let currentY = y;
  const offsetStep = 20; // Move down 20px each attempt

  for (let i = 0; i < 50; i++) {
    if (!hasCollision(x, currentY, width, height)) {
      return { x, y: currentY };
    }
    currentY += offsetStep;
  }

  return { x, y: currentY }; // Last resort
}
```

### Connection Side Calculation

The layout engine determines which sides arrows should connect to:

```typescript
// Primary → Neutral: Horizontal (right → left)
if (from.variant === 'primary' && to.variant === 'neutral') {
  fromSide = 'right';
  toSide = 'left';
  targetY = fromY + fromHeight/2 - toHeight/2; // Align midpoints
}

// Neutral → Secondary: Horizontal (right → left)
else if (from.variant === 'neutral' && to.variant === 'secondary') {
  fromSide = 'right';
  toSide = 'left';
  targetY = fromY + fromHeight/2 - toHeight/2;
}

// Neutral → Neutral: Vertical (bottom → top)
else if (from.variant === 'neutral' && to.variant === 'neutral') {
  fromSide = 'bottom';
  toSide = 'top';
  targetY = fromY + fromHeight + nodeSpacing;
}

// Secondary → Any: Vertical (bottom → top)
else if (from.variant === 'secondary') {
  fromSide = 'bottom';
  toSide = 'top';
  targetY = fromY + fromHeight + nodeSpacing;
}

// Loop back to Primary: Special handling
else if (to.variant === 'primary') {
  fromSide = from.variant === 'neutral' ? 'left' : 'bottom';
  toSide = 'top';
  targetY = fromY + fromHeight + nodeSpacing;
}
```

---

## Rendering Logic

The `FlowChartV2.tsx` component transforms layout data into SVG.

### Component Structure

```typescript
export function FlowChartV2({
  data,
  title,
  subtitle,
  maxWidth,
  scale = 1,
  className,
}: FlowChartV2Props) {
  // 1. Calculate layout
  const layout = calculateLayout(data, { scale });

  // 2. Calculate final scale for maxWidth
  const finalScale = maxWidth
    ? Math.min(scale, maxWidth / layout.width)
    : scale;

  // 3. Count connections per side (for staggering)
  const { fromSideCounts, toSideCounts } = countConnectionsPerSide();

  // 4. Render SVG
  return (
    <svg>
      <defs>{/* Arrowhead markers */}</defs>
      {/* Header */}
      {/* Arrows */}
      {/* Nodes */}
      {/* Labels */}
    </svg>
  );
}
```

### Connection Point Staggering

When multiple arrows exit/enter the same side of a node, they're staggered to avoid overlap:

```typescript
function getStaggeredConnectionPoint(
  node: PositionedNode,
  side: 'top' | 'right' | 'bottom' | 'left',
  isFrom: boolean,
  connectionIndex: number
) {
  // 1. Get count of connections on this side
  const count = getSideCount(node, side, isFrom);

  // 2. Find this connection's position in the list (0, 1, 2...)
  const positionIndex = findPositionIndex(node, side, connectionIndex);

  // 3. Calculate offset
  const spacing = count > 1 ? 20 : 0;
  const totalWidth = (count - 1) * spacing;
  const offset = positionIndex * spacing - totalWidth / 2;

  // 4. Apply offset to connection point
  switch (side) {
    case 'right':
      return {
        x: node.x + node.width,
        y: node.y + node.height / 2 + offset  // Offset vertically
      };
    case 'bottom':
      return {
        x: node.x + node.width / 2 + offset,  // Offset horizontally
        y: node.y + node.height
      };
    // ...
  }
}
```

**Visual Example:**
```
Without staggering:        With staggering:
┌─────┐                    ┌─────┐
│     │═══>                │     │╶─>
│     │═══>                │     │══>
│     │═══>                │     │╶─>
└─────┘                    └─────┘
```

---

## Arrow Routing

Arrows use **Manhattan routing** (only horizontal and vertical segments, no diagonals).

### Minimum Travel Distance

Arrows must travel a minimum distance in their exit direction before turning:

```typescript
const minTravelDistance = 25;

// Calculate first waypoint
switch (fromSide) {
  case 'right':
    firstPoint = { x: start.x + minTravelDistance, y: start.y };
    break;
  case 'bottom':
    firstPoint = { x: start.x, y: start.y + minTravelDistance };
    break;
  // ...
}
```

**Example:**
```
Bad (turns immediately):     Good (minimum travel):
┌────┐                       ┌────┐
│    │─┐                     │    │───┐
└────┘ │                     └────┘   │
       └─>                            └─>
```

### 180-Degree Reversal Prevention

Arrows cannot immediately reverse direction (e.g., exit bottom then immediately go up):

```typescript
const is180Reversal =
  (fromSide === 'bottom' && toSide === 'top') ||
  (fromSide === 'top' && toSide === 'bottom') ||
  (fromSide === 'right' && toSide === 'left') ||
  (fromSide === 'left' && toSide === 'right');

if (is180Reversal) {
  // Must go perpendicular first
  if (fromSide === 'bottom' && toSide === 'top') {
    // Go down → across → up
    path = `M ${start.x} ${start.y}
            L ${start.x} ${firstPoint.y}     // Down
            L ${end.x} ${firstPoint.y}       // Across
            L ${end.x} ${lastPoint.y}        // Up (approach)
            L ${end.x} ${end.y}`;            // Final
  }
}
```

**Example:**
```
Bad (180° reversal):     Good (perpendicular routing):
┌────┐                   ┌────┐
│    │                   │    │
└──↓─┘                   └──↓─┘
   ↑ Wrong!                 │
   │                        └──→ ┐
   │                             │
┌──┴─┐                           ↓
│    │                        ┌────┐
└────┘                        │    │
                              └────┘
```

### Path Construction Patterns

**1. Horizontal Exit → Vertical Entry:**
```typescript
// Exit right, enter top
path = `M ${start.x} ${start.y}      // Start
        L ${end.x} ${start.y}        // Go right to target X
        L ${end.x} ${lastPoint.y}    // Go down to approach point
        L ${end.x} ${end.y}`;        // Final approach
```

**2. Vertical Exit → Horizontal Entry:**
```typescript
// Exit bottom, enter left
path = `M ${start.x} ${start.y}      // Start
        L ${start.x} ${end.y}        // Go down to target Y
        L ${lastPoint.x} ${end.y}    // Go right to approach point
        L ${end.x} ${end.y}`;        // Final approach
```

**3. Same Direction (e.g., both vertical):**
```typescript
// Exit bottom, enter bottom (parallel)
const midY = (start.y + end.y) / 2;
path = `M ${start.x} ${start.y}      // Start
        L ${start.x} ${midY}         // Go down to midpoint
        L ${end.x} ${midY}           // Go across at midpoint
        L ${end.x} ${end.y}`;        // Go down to end
```

---

## Collision Avoidance

The most complex part of the system: ensuring arrows never pass through nodes.

### Segment Intersection Detection

**Horizontal Segment Check:**
```typescript
function horizontalSegmentIntersectsNode(
  y: number,              // Line's Y coordinate
  x1: number,             // Line start X
  x2: number,             // Line end X
  node: PositionedNode
): boolean {
  const buffer = 10;
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);

  // Check Y overlap
  if (y < node.y - buffer || y > node.y + node.height + buffer) {
    return false;  // Line Y is above or below node
  }

  // Check X overlap
  if (maxX < node.x - buffer || minX > node.x + node.width + buffer) {
    return false;  // Line X range doesn't overlap node
  }

  return true;  // Collision!
}
```

**Visual Explanation:**
```
Line Y within node's Y range:
         y ────────────────>

         ┌─────────┐
         │  Node   │  ← Collision!
         └─────────┘

Line Y outside node's Y range:
  y ───────────────────>
                           ┌─────────┐
                           │  Node   │  ← No collision
                           └─────────┘
```

**Vertical Segment Check:**
```typescript
function verticalSegmentIntersectsNode(
  x: number,              // Line's X coordinate
  y1: number,             // Line start Y
  y2: number,             // Line end Y
  node: PositionedNode
): boolean {
  const buffer = 10;
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  // Check X overlap
  if (x < node.x - buffer || x > node.x + node.width + buffer) {
    return false;  // Line X is left or right of node
  }

  // Check Y overlap
  if (maxY < node.y - buffer || minY > node.y + node.height + buffer) {
    return false;  // Line Y range doesn't overlap node
  }

  return true;  // Collision!
}
```

### Gutter Routing

When a collision is detected, arrows route through "gutters" - safe spaces beside nodes:

```typescript
// Example: Bottom → Top with node in between
if (fromSide === 'bottom' && toSide === 'top') {
  const otherNodes = nodes.filter(
    n => n.id !== from.id && n.id !== to.id
  );

  // Check if horizontal route would collide
  const horizontalY = firstPoint.y;
  const needsGutterRoute = otherNodes.some(node =>
    horizontalSegmentIntersectsNode(horizontalY, start.x, end.x, node)
  );

  if (needsGutterRoute) {
    // Route through gutter
    const gutterX = start.x < end.x
      ? from.x + from.width + 30   // Right side gutter
      : from.x - 30;                // Left side gutter

    path = `M ${start.x} ${start.y}       // Start
            L ${start.x} ${firstPoint.y}  // Down
            L ${gutterX} ${firstPoint.y}  // To gutter
            L ${gutterX} ${lastPoint.y}   // Vertical in gutter
            L ${end.x} ${lastPoint.y}     // Across to target
            L ${end.x} ${end.y}`;         // Final approach
  }
}
```

**Visual Example:**
```
Without collision avoidance:    With gutter routing:
┌────┐                          ┌────┐
│ A  │                          │ A  │
└──↓─┘                          └──↓─┘
   ↓                               └──→┐
┌──┼──┐  ← Arrow through node          │ ← Gutter
│  B  │                                 │
└─────┘                                 │
   ↑                                    ↓
┌──┴──┐                          ┌─────┐
│  C  │                          │  B  │
└─────┘                          └─────┘
                                       ↑
                                 ┌─────┤
                                 │  C  │
                                 └─────┘
```

### Collision Checking Integration

The collision check is integrated into all path calculation branches:

```typescript
// 1. Filter out source and destination (can pass through own nodes)
const otherNodes = layout.nodes.filter(
  n => n.node.id !== from.node.id && n.node.id !== to.node.id
);

// 2. Check if proposed path collides
let needsGutterRoute = otherNodes.some(node =>
  horizontalSegmentIntersectsNode(proposedY, start.x, end.x, node) ||
  verticalSegmentIntersectsNode(proposedX, start.y, end.y, node)
);

// 3. Use gutter routing if collision detected
if (needsGutterRoute) {
  // Calculate gutter position
  // Build alternative path
} else {
  // Use direct path
}
```

---

## Visual Features

### Perpendicular Start Indicators

Small lines show where arrows originate from nodes:

```typescript
// Calculate perpendicular line position
const perpLength = 10;
const offset = 3;  // Offset from node edge so it's visible

switch (fromSide) {
  case 'right':
    // Vertical line to the right of node
    perpLine = {
      x1: start.x + offset,
      y1: start.y - perpLength,
      x2: start.x + offset,
      y2: start.y + perpLength,
    };
    break;
  case 'bottom':
    // Horizontal line below node
    perpLine = {
      x1: start.x - perpLength,
      y1: start.y + offset,
      x2: start.x + perpLength,
      y2: start.y + offset,
    };
    break;
}

// Render
<line
  x1={perpLine.x1}
  y1={perpLine.y1}
  x2={perpLine.x2}
  y2={perpLine.y2}
  stroke={arrowColor}
  strokeWidth={2}
/>
```

### Arrow Color Mapping

Colors are determined by the connection's `color` property:

```typescript
let arrowColor = '#333333';      // Default gray
let arrowMarker = 'arrowhead-default';

if (isActive) {
  switch (color) {
    case 'green':
      arrowColor = '#4CAF50';
      arrowMarker = 'arrowhead-yes';
      break;
    case 'red':
      arrowColor = '#e74c3c';
      arrowMarker = 'arrowhead-no';
      break;
    case 'blue':
      arrowColor = '#2196F3';
      arrowMarker = 'arrowhead-active';
      break;
    case 'orange':
      arrowColor = '#FF9800';
      arrowMarker = 'arrowhead-no';
      break;
    default:
      arrowColor = '#2196F3';
      arrowMarker = 'arrowhead-active';
  }
} else if (isActive === false) {
  // Explicitly inactive
  arrowColor = '#cccccc';
  arrowMarker = 'arrowhead-inactive';
}
```

### SVG Arrowhead Markers

Arrowheads are defined once and reused:

```typescript
<defs>
  <marker
    id="arrowhead-yes"
    markerWidth={6}
    markerHeight={6}
    refX={5.5}       // Position at tip
    refY={2.5}       // Center vertically
    orient="auto"    // Auto-rotate to match line angle
  >
    <polygon
      points="0 0.5, 6 2.5, 0 4.5"  // Triangle shape
      fill="#4CAF50"                 // Green
    />
  </marker>
</defs>

<!-- Use marker on path -->
<path
  d={pathD}
  stroke="#4CAF50"
  markerEnd="url(#arrowhead-yes)"
/>
```

### Label Positioning

Labels are positioned along arrow paths with circular backgrounds:

```typescript
let labelPos: { x: number; y: number };

// Position based on connection types
if (fromSide === 'bottom' && toSide === 'top') {
  // Vertical connection: label at midpoint
  labelPos = {
    x: start.x,
    y: (start.y + end.y) / 2
  };
} else if (fromSide === 'right' && toSide === 'left') {
  // Horizontal connection: label at midpoint
  labelPos = {
    x: (start.x + end.x) / 2,
    y: start.y
  };
}

// Determine label circle color
let circleColor = '#2196F3';  // Default blue
if (isActive === false) {
  circleColor = '#9e9e9e';    // Gray for inactive
} else if (color === 'green') {
  circleColor = '#4CAF50';
} else if (color === 'red') {
  circleColor = '#e74c3c';
}

// Render label
<g>
  <circle
    cx={labelPos.x}
    cy={labelPos.y}
    r={15}
    fill={circleColor}
  />
  <text
    x={labelPos.x}
    y={labelPos.y}
    textAnchor="middle"
    dominantBaseline="middle"
    fill="white"
    fontWeight="bold"
  >
    {label}
  </text>
</g>
```

### Active Path Highlighting

When `isActive: true` on nodes, special styling is applied:

```typescript
// In Node.tsx
const borderWidth = node.isActive ? 4 : 2;
const opacity = node.isActive === false ? 0.4 : 1;

<rect
  stroke="#2196F3"
  strokeWidth={borderWidth}
  opacity={opacity}
  // ...
/>
```

---

## Extension Guide

### Adding a New Connection Color

**Step 1: Update types.ts**
```typescript
export type ConnectionColor =
  | 'green'
  | 'red'
  | 'blue'
  | 'orange'
  | 'purple'    // NEW
  | 'default';
```

**Step 2: Add arrowhead marker in FlowChartV2.tsx**
```typescript
<marker id="arrowhead-purple" {/* ... */}>
  <polygon fill="#9C27B0" {/* ... */} />
</marker>
```

**Step 3: Add color mapping**
```typescript
case 'purple':
  arrowColor = '#9C27B0';
  arrowMarker = 'arrowhead-purple';
  break;
```

**Step 4: Add label circle color**
```typescript
case 'purple':
  circleColor = '#9C27B0';
  break;
```

### Adding a New Node Variant

**Step 1: Update types.ts**
```typescript
export type NodeVariant =
  | 'primary'
  | 'neutral'
  | 'secondary'
  | 'warning';   // NEW
```

**Step 2: Add dimensions in layoutEngine.ts**
```typescript
const defaultConfig: LayoutConfig = {
  // ...
  warningWidth: 180,
  warningHeight: 70,
};

function getNodeDimensions(node: FlowNode) {
  switch (node.variant) {
    case 'warning':
      return {
        width: cfg.warningWidth * cfg.scale,
        height: cfg.warningHeight * cfg.scale
      };
    // ...
  }
}
```

**Step 3: Add default column**
```typescript
function getNodeColumn(node: FlowNode): number {
  if (node.column !== undefined) {
    columnNumber = node.column;
  } else {
    switch (node.variant) {
      case 'warning':
        columnNumber = 4;  // New column
        break;
      // ...
    }
  }
  // ...
}
```

**Step 4: Add styling in Node.tsx**
```typescript
function getNodeStyle(variant: NodeVariant) {
  switch (variant) {
    case 'warning':
      return {
        fill: '#fff3e0',        // Light orange background
        stroke: '#ff9800',      // Orange border
        textFill: '#e65100',    // Dark orange text
      };
    // ...
  }
}
```

### Customizing Arrow Routing Logic

**Example: Always route certain connections vertically**

```typescript
// In layoutEngine.ts, in the connection iteration
node.connections.forEach((conn, connIndex) => {
  // ...

  // Custom routing for specific labels
  if (conn.label === 'Error' || conn.label === 'Retry') {
    // Force vertical routing
    fromSide = 'bottom';
    toSide = 'top';
    targetY = y + positioned.height + cfg.nodeSpacing * cfg.scale;
  } else {
    // Normal routing logic
    // ...
  }

  layoutNode(conn.targetId, targetColumn, targetY, positioned, conn, fromSide, toSide);
});
```

### Adding Custom Layout Configurations

**Example: Adjusting spacing based on flowchart size**

```typescript
// Calculate dynamic spacing
const nodeCount = chartData.nodes.length;
const dynamicSpacing = nodeCount > 20 ? 40 : 50;  // Tighter for large charts

const cfg = {
  ...defaultConfig,
  nodeSpacing: dynamicSpacing,
  ...config
};
```

### Implementing Custom Collision Avoidance Strategies

**Example: Smart gutter selection (choose least crowded side)**

```typescript
function findBestGutter(from, to, nodes) {
  const rightGutterX = from.x + from.width + 30;
  const leftGutterX = from.x - 30;

  // Count nodes near each gutter
  const nodesNearRight = nodes.filter(n =>
    Math.abs(n.x - rightGutterX) < 50
  ).length;

  const nodesNearLeft = nodes.filter(n =>
    Math.abs(n.x - leftGutterX) < 50
  ).length;

  // Choose less crowded side
  return nodesNearLeft < nodesNearRight ? leftGutterX : rightGutterX;
}
```

### Adding Animation Support

**Example: Animate arrows along path**

```typescript
// Add CSS animation
<path
  d={pathD}
  stroke={arrowColor}
  strokeDasharray="5,5"
  strokeDashoffset={0}
>
  <animate
    attributeName="stroke-dashoffset"
    from="0"
    to="10"
    dur="0.5s"
    repeatCount="indefinite"
  />
</path>
```

### Creating Custom Node Shapes

**Modify Node.tsx to support different shapes:**

```typescript
interface NodeProps {
  node: FlowNode;
  shape?: 'rectangle' | 'circle' | 'diamond';  // NEW
  // ...
}

export function Node({ node, shape = 'rectangle', ...props }: NodeProps) {
  const style = getNodeStyle(node.variant);

  switch (shape) {
    case 'circle':
      return (
        <circle
          cx={x + width / 2}
          cy={y + height / 2}
          r={width / 2}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={borderWidth}
        />
      );

    case 'diamond':
      const path = `M ${x + width/2} ${y}
                    L ${x + width} ${y + height/2}
                    L ${x + width/2} ${y + height}
                    L ${x} ${y + height/2} Z`;
      return <path d={path} fill={style.fill} stroke={style.stroke} />;

    default:
      return <rect {/* ... */} />;
  }
}
```

---

## Common Pitfalls and Solutions

### 1. Arrows Still Passing Through Nodes

**Problem:** Collision detection not catching all cases

**Solution:** Increase buffer size or add more granular segment checks
```typescript
const buffer = 15;  // Increase from 10 to 15
```

### 2. Labels Floating in Wrong Position

**Problem:** Label positioned on segment that gets rerouted

**Solution:** Recalculate label position after final path is determined
```typescript
// Calculate label position from actual path segments
const segments = parsePath(pathD);
const midSegment = segments[Math.floor(segments.length / 2)];
const labelPos = getMidpoint(midSegment);
```

### 3. Nodes Overlapping Despite Collision Detection

**Problem:** Collision detection runs during layout but nodes added later conflict

**Solution:** Layout engine already handles this - ensure you're using `findAvailablePosition()` for ALL nodes

### 4. Performance Issues with Large Flowcharts

**Problem:** O(n²) collision checking slows down with many nodes

**Solution:** Implement spatial partitioning
```typescript
// Divide canvas into grid
const grid = createGrid(layout.width, layout.height, cellSize: 200);

// Only check nodes in nearby cells
function hasCollision(x, y, width, height) {
  const nearbyNodes = grid.getNodesNear(x, y, width, height);
  return nearbyNodes.some(node => rectanglesOverlap(/*...*/));
}
```

### 5. Circular Dependencies

**Problem:** Node A → Node B → Node A creates infinite loop

**Solution:** Already handled by `visited` Set in layout engine
```typescript
if (visited.has(nodeId)) {
  // Create connection but don't recurse
  createConnection(parentNode, existingNode);
  return;
}
visited.add(nodeId);
```

---

## Testing Strategies

### Unit Testing Types

```typescript
// Test node creation
const node: FlowNode = {
  id: 'test-1',
  variant: 'primary',
  label: 'Test',
  connections: [{ targetId: 'test-2' }]
};

expect(node.id).toBe('test-1');
expect(node.connections).toHaveLength(1);
```

### Testing Layout Algorithm

```typescript
const data: FlowChartData = {
  rootId: 'a',
  nodes: [
    { id: 'a', variant: 'primary', label: 'A', connections: [{ targetId: 'b' }] },
    { id: 'b', variant: 'neutral', label: 'B', connections: [] }
  ]
};

const layout = calculateLayout(data);

expect(layout.nodes).toHaveLength(2);
expect(layout.connections).toHaveLength(1);
expect(layout.nodes[0].x).toBe(50);  // Column 1
expect(layout.nodes[1].x).toBe(300); // Column 2
```

### Testing Collision Detection

```typescript
const node1 = { x: 100, y: 100, width: 180, height: 70 };
const node2 = { x: 150, y: 120, width: 180, height: 70 };

// Should detect overlap
expect(rectanglesOverlap(node1, node2)).toBe(true);

const node3 = { x: 400, y: 100, width: 180, height: 70 };

// Should not detect overlap
expect(rectanglesOverlap(node1, node3)).toBe(false);
```

### Visual Regression Testing

Use screenshot comparison tools to catch rendering issues:

```typescript
test('renders financial flowchart correctly', async () => {
  render(<FlowChartV2 data={financialExample} />);
  const screenshot = await page.screenshot();
  expect(screenshot).toMatchImageSnapshot();
});
```

---

## Performance Optimization Tips

### 1. Memoize Layout Calculations

```typescript
import { useMemo } from 'react';

function FlowChartV2({ data, scale }: Props) {
  const layout = useMemo(
    () => calculateLayout(data, { scale }),
    [data, scale]
  );

  // ...
}
```

### 2. Virtualize Large Flowcharts

Only render nodes visible in viewport:

```typescript
const visibleNodes = layout.nodes.filter(node =>
  isInViewport(node, viewportBounds)
);

return (
  <svg>
    {visibleNodes.map(node => <Node {...node} />)}
  </svg>
);
```

### 3. Simplify Paths for Inactive Connections

```typescript
if (!isActive) {
  // Use simpler path calculation (straight line)
  pathD = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
} else {
  // Use full collision-aware routing
  pathD = calculateComplexPath(/*...*/);
}
```

### 4. Reduce Re-renders

```typescript
const Node = React.memo(({ node, x, y, width, height }: NodeProps) => {
  // Component only re-renders if props change
  // ...
}, (prev, next) => {
  return prev.node.id === next.node.id &&
         prev.x === next.x &&
         prev.y === next.y;
});
```

---

## Debugging Tips

### 1. Visualize Collision Buffers

```typescript
// Render semi-transparent collision boxes
{layout.nodes.map(node => (
  <rect
    key={`buffer-${node.node.id}`}
    x={node.x - buffer}
    y={node.y - buffer}
    width={node.width + buffer * 2}
    height={node.height + buffer * 2}
    fill="rgba(255, 0, 0, 0.1)"
    stroke="red"
    strokeDasharray="5,5"
  />
))}
```

### 2. Log Path Calculations

```typescript
console.log('Arrow path:', {
  from: from.node.id,
  to: to.node.id,
  fromSide,
  toSide,
  pathD,
  needsGutterRoute,
  collidingNodes: otherNodes.filter(/* ... */)
});
```

### 3. Highlight Problematic Connections

```typescript
// Mark connections that required gutter routing
const strokeDasharray = needsGutterRoute ? "5,5" : "none";

<path
  d={pathD}
  stroke={arrowColor}
  strokeDasharray={strokeDasharray}  // Dashed = rerouted
/>
```

### 4. Visual Node IDs

```typescript
// Show node IDs for debugging
<text
  x={node.x + node.width / 2}
  y={node.y - 10}
  textAnchor="middle"
  fill="red"
  fontSize="10"
>
  {node.node.id}
</text>
```

---

## Additional Resources

### Related Concepts

- **SVG Path Syntax**: [MDN Path Tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths)
- **Graph Layout Algorithms**: Sugiyama, Dagre, Elk
- **Collision Detection**: AABB (Axis-Aligned Bounding Box)
- **Manhattan Distance**: L1 metric, rectilinear distance

### Recommended Reading

- "Graph Drawing: Algorithms for the Visualization of Graphs" by Di Battista et al.
- "Layered Graph Drawing" - Sugiyama's algorithm
- SVG specification for path commands and markers

---

## Changelog

### Version 2.0 (Current)
- Connections array instead of next/nextYes/nextNo
- Color-coded arrows with custom colors
- Collision-aware gutter routing
- Manhattan routing with 180° prevention
- Perpendicular start indicators
- Staggered multi-arrow support

### Version 1.0
- Basic node rendering
- Simple arrow routing
- next/nextYes/nextNo navigation
- Column-based layout

---

## Contributing

When modifying this code:

1. **Test edge cases**: Multiple connections, loops, long chains
2. **Check collision detection**: Add test cases with overlapping nodes
3. **Verify all variants**: Test with all node variants and colors
4. **Document changes**: Update this README with your modifications
5. **Maintain backwards compatibility**: Use optional properties for new features

---

## License

[Your License Here]

---

**Last Updated**: 2025-10-27
**Maintainer**: [Your Name]
**Version**: 2.0.0
