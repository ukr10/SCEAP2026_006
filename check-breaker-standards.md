# Electrical Protection Standards - Breaker Selection

## IEC 60898 / IEC 60947-2 Standards

### MCB (Miniature Circuit Breaker)
- Rating: 6A to 63A
- Common sizes: 6, 10, 16, 20, 32, 40, 50, 63A
- Load capacity: Up to ~50A max
- Typical load (415V 3-phase, 0.95 PF): 8-12 kW max
- Use: Single circuit protection, lighting circuits, small motors with external starter

### MCCB (Molded Case Circuit Breaker)
- Rating: 16A to 630A
- Common sizes: 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630A
- Load capacity: 50A to 630A
- Typical load (415V 3-phase, 0.95 PF): 12-100+ kW
- Use: Branch feeders, motor circuits (with external starter), main distribution panel

### ACB (Air Circuit Breaker)
- Rating: 63A to 6300A+
- Common sizes: 100, 200, 250, 400, 630, 800, 1000, 1250, 1600A
- Load capacity: >630A (main incoming)
- Typical load (415V 3-phase, 0.95 PF): >100 kW
- Use: Main incoming, very large feeders, transformer backup protection

## Load @ 415V, √3, PF=0.95 Conversion:
I(A) = P(kW) / (0.415 × 1.732 × 0.95) = P(kW) / 0.683

- 10 kW → 14.6A → MCB
- 15 kW → 22A → MCB or MCCB
- 22 kW → 32A → MCCB
- 30 kW → 44A → MCCB
- 37 kW → 54A → MCCB (with appropriate starter for motor)
- 45 kW → 66A → MCCB
- 50 kW → 73A → MCCB
- 65 kW → 95A → MCCB
- 85 kW → 124A → MCCB/ACB boundary
- 100 kW → 146A → MCCB or ACB
- 120 kW → 175A → ACB recommended
- 200 kW → 292A → ACB

## CORRECTED ALLOCATION RULES:
- <8 kW → MCB
- 8-20 kW → MCB or MCCB (for panel-to-load circuits)
- 20-100 kW → MCCB (standard choice)
- >100 kW → ACB (main incoming or heavy feeders)
