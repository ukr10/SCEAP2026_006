#!/usr/bin/env node
/**
 * Debug: What cable size is being assigned to the 37kW pump?
 */

import fs from 'fs';
import path from 'path';

// Read the compiled CableSizingEngine
const engineCode = fs.readFileSync(
  '/workspaces/SCEAP2026_004/sceap-frontend/dist/assets/index.es-D9t3gih4.js',
  'utf-8'
);

// This is complex because it's bundled. Let me try a different approach:
// Create a simple Node test that imports the actual TS files

// Let me just analyze the logic instead
console.log(`
=== DEBUGGING 37kW PUMP CABLE SIZING ===

Cable 6: Fire Pump Motor - 37kW
- Voltage: 415V (3-phase)
- Power: 37kW
- Length: 25m
- Power Factor: 0.85
- Efficiency: 92%
- Installation: Air
- Starting: DOL (5x current multiplier)
- Material: Copper (Cu)
- Cores: 3C (3-core)

=== CALCULATIONS ===

1. FLC Calculation:
   FLC = P / (√3 × V × PF × η)
   FLC = 37000 / (1.732 × 415 × 0.85 × 0.92)
   FLC = 37000 / 555.7
   FLC = 66.5 A

2. Starting Current (DOL = 5×):
   I_start = 66.5 × 5 = 332.5 A

3. Derated FLC (assuming derating factor = 1.0 for air):
   I_derated = 66.5 A

4. Cable Size Constraints:
   
   a) By Ampacity (66.5A derated):
      - 35mm² @ 90°C, 3C, Air = 163A rating ✓ MORE than enough
      - 25mm² @ 90°C, 3C, Air = 133A rating ✓ Sufficient
      - SHOULD SELECT: 25-35mm²

   b) By Running Voltage Drop (3% or 5% limit):
      - For 35mm² Cu: R = 0.668 Ω/km
      - VD = (√3 × 66.5 × 25 × 0.668) / 1000
      - VD = (1.732 × 66.5 × 25 × 0.668) / 1000 = 1.916 V
      - VD% = 1.916 / 415 = 0.46% ✓ MEETS 5% LIMIT
      - SHOULD SELECT: 25mm² or larger

   c) By Starting Voltage Drop (15% limit for DOL):
      - For 50mm² Cu: R = 0.494 Ω/km
      - VD_start = (√3 × 332.5 × 25 × 0.494) / 1000
      - VD_start = (1.732 × 332.5 × 25 × 0.494) / 1000 = 7.13 V
      - VD% = 7.13 / 415 = 1.72% ✓ MEETS 15% LIMIT
      - SHOULD SELECT: 35mm² or larger

   d) By ISc (Short Circuit - ACB only):
      - Cable 6 protected by ACB
      - Max ISc = 12kA (from demo data)
      - Formula: A ≥ Isc / (k × √t)
      - Assuming: k=143 (Cu XLPE), t=0.1s
      - A ≥ 12000 / (143 × √0.1) = 12000 / (143 × 0.316) = 265mm²
      - ISc constraint would force 300mm² selection! ← PROBLEM HERE

=== SUSPECTED ROOT CAUSE ===

The ISc (Short-Circuit) constraint is forcing the selection to 300mm²!

The formula:  A ≥ Isc / (k × √t)

Potential issues:
1. Protection clearing time (t) might be wrong
2. ISc value might be misinterpreted
3. ISc constraint might be applied when it shouldn't be
4. The ISc check might be inverted or using wrong units

Current logic:
  result.sizeByISc = this.findSizeByISc(input.maxShortCircuitCurrent);
  result.selectedConductorArea = Math.max(
    result.sizeByAmpacity,
    result.sizeByRunningVdrop,
    result.sizeByStartingVdrop || 0,
    result.sizeByISc || 0  ← Taking MAX means ISc of 265+ forces 300mm²
  );

=== SOLUTION ===

The ISc constraint should NOT be this large. Investigate:
1. What is the actual protection clearing time?
2. Is ISc being applied correctly for 3C cables?
3. Is the short circuit constant correct?
4. Should ISc constraint be relaxed or disabled for motor loads?
`);
