#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

// Load the master Excel file
const excelPath = '/workspaces/SCEAP2026_005/images/11 kV Cable sizing_Updated 3 1.xlsx';
const workbook = XLSX.readFile(excelPath);

console.log('\n' + '='.repeat(100));
console.log('EXCEL STRUCTURE ANALYSIS - HT CABLE SHEET');
console.log('='.repeat(100));

// Get the HT Cable sheet
const htSheet = workbook.Sheets['HT Cable'];
if (!htSheet) {
  console.log('❌ HT Cable sheet not found!');
  console.log('Available sheets:', Object.keys(workbook.Sheets));
  process.exit(1);
}

// Get the range info
const range = XLSX.utils.decode_range(htSheet['!ref']);
console.log('\nSheet Dimensions:');
console.log(`  Rows: ${range.s.r} to ${range.e.r} (total: ${range.e.r - range.s.r + 1})`);
console.log(`  Columns: ${range.s.c} to ${range.e.c} (A-${String.fromCharCode(65 + range.e.c)})`);

// Extract headers (assume row 1 or 2 is header)
console.log('\n' + '='.repeat(100));
console.log('COLUMN HEADERS & STRUCTURE');
console.log('='.repeat(100));

const headers = {};
for (let col = range.s.c; col <= range.e.c; col++) {
  const cellA = XLSX.utils.encode_cell({ r: 0, c: col });
  const cellB = XLSX.utils.encode_cell({ r: 1, c: col });
  
  const headerA = htSheet[cellA]?.v;
  const headerB = htSheet[cellB]?.v;
  
  const header = headerB || headerA || `Col_${col}`;
  headers[col] = header;
  
  const colLetter = String.fromCharCode(65 + col);
  console.log(`  ${colLetter}: ${headerA} ${headerB ? '→ ' + headerB : ''}`);
}

// Extract sample data rows (8-20)
console.log('\n' + '='.repeat(100));
console.log('SAMPLE DATA ROWS (8-20)');
console.log('='.repeat(100));

const sampleData = [];
for (let row = 7; row <= 19; row++) {
  const rowData = {};
  
  for (let col = range.s.c; col <= Math.min(range.e.c, 30); col++) {
    const cell = XLSX.utils.encode_cell({ r: row, c: col });
    const cellObj = htSheet[cell];
    
    if (cellObj) {
      const value = cellObj.v;
      const formula = cellObj.f;
      rowData[headers[col]] = {
        value,
        formula: formula ? `=${formula}` : null
      };
    }
  }
  
  if (Object.keys(rowData).length > 0) {
    sampleData.push(rowData);
  }
}

// Display sample row
console.log('\n📌 Sample Row 8 (First data row):');
const firstRow = sampleData[0];
Object.entries(firstRow).slice(0, 10).forEach(([col, data]) => {
  console.log(`  ${col}: ${data.value} ${data.formula ? data.formula : ''}`);
});

// Analyze data types and ranges
console.log('\n' + '='.repeat(100));
console.log('DATA TYPE & VALUE RANGES');
console.log('='.repeat(100));

const analysis = {};
Object.keys(firstRow).forEach(col => {
  analysis[col] = {
    values: [],
    types: new Set(),
    min: Infinity,
    max: -Infinity,
    hasFormula: false
  };
});

sampleData.forEach(row => {
  Object.entries(row).forEach(([col, data]) => {
    if (data.value !== undefined) {
      analysis[col].values.push(data.value);
      analysis[col].types.add(typeof data.value);
      
      if (typeof data.value === 'number') {
        analysis[col].min = Math.min(analysis[col].min, data.value);
        analysis[col].max = Math.max(analysis[col].max, data.value);
      }
      
      if (data.formula) {
        analysis[col].hasFormula = true;
      }
    }
  });
});

Object.entries(analysis).slice(0, 15).forEach(([col, stats]) => {
  console.log(`\n  ${col}:`);
  console.log(`    Type: ${Array.from(stats.types).join(', ')}`);
  if (stats.min !== Infinity) {
    console.log(`    Range: ${stats.min} to ${stats.max}`);
  }
  console.log(`    Sample: ${stats.values[0]}`);
  if (stats.hasFormula) console.log('    ✓ Contains formulas');
});

// Look for hidden columns or merged cells
console.log('\n' + '='.repeat(100));
console.log('SPECIAL ELEMENTS');
console.log('='.repeat(100));

if (htSheet['!merges']) {
  console.log(`✓ Merged cells: ${htSheet['!merges'].length}`);
  htSheet['!merges'].slice(0, 5).forEach(merge => {
    console.log(`  ${merge.s.c}:${merge.e.c}, ${merge.s.r}:${merge.e.r}`);
  });
}

if (htSheet['!cols']) {
  console.log(`✓ Custom column widths: ${htSheet['!cols'].length}`);
}

// Extract key formulas
console.log('\n' + '='.repeat(100));
console.log('KEY FORMULAS (Sample from Row 8)');
console.log('='.repeat(100));

let formulaCount = 0;
Object.entries(firstRow).forEach(([col, data]) => {
  if (data.formula && formulaCount < 10) {
    console.log(`  ${col}: ${data.formula}`);
    formulaCount++;
  }
});

console.log('\n✅ Analysis complete. Use this structure to redesign Results page.\n');
