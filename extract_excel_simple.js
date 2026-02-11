#!/usr/bin/env node

const XLSX = require('xlsx');

const excelPath = '/workspaces/SCEAP2026_005/images/11 kV Cable sizing_Updated 3 1.xlsx';
const workbook = XLSX.readFile(excelPath);

console.log('\n📋 AVAILABLE SHEETS:');
Object.keys(workbook.Sheets).forEach((sheet, idx) => {
  console.log(`  ${idx + 1}. ${sheet}`);
});

const htSheet = workbook.Sheets['HT Cable'];
if (!htSheet) {
  console.log('\n❌ HT Cable sheet not found');
  process.exit(1);
}

console.log('\n✅ Reading HT Cable sheet...\n');

// Convert to JSON to see structure
const range = XLSX.utils.decode_range(htSheet['!ref']);
console.log(`Sheet size: ${range.e.r + 1} rows × ${range.e.c + 1} columns`);

// Read top rows to find actual headers
console.log('\n📊 Top 10 rows (raw cells):');
for (let row = 0; row < 10; row++) {
  let rowData = [];
  for (let col = 0; col < 25; col++) {
    const cell = XLSX.utils.encode_cell({ r: row, c: col });
    const value = htSheet[cell]?.v;
    if (value) {
      rowData.push(`${cell}:${value}`);
    }
  }
  if (rowData.length > 0) {
    console.log(`Row ${row}: ${rowData.join(' | ')}`);
  }
}

// Now extract data from actual row 8
console.log('\n📈 Data Row 8 (all columns with values):');
const row8 = [];
for (let col = 0; col <= 45; col++) {
  const cell = XLSX.utils.encode_cell({ r: 7, c: col });
  const cellObj = htSheet[cell];
  if (cellObj) {
    row8.push({
      cell,
      value: cellObj.v,
      formula: cellObj.f,
      type: cellObj.t
    });
  }
}

console.log(`Found ${row8.length} columns with data in row 8:`);
row8.forEach((item, idx) => {
  console.log(
    `  ${idx + 1}. ${item.cell}: ${item.value} ${item.formula ? '(Formula: ' + item.formula + ')' : ''}`
  );
});

// Get all rows 8-20 to see value variations
console.log('\n📊 All data rows (8-20) - Columns A to N:');
for (let row = 7; row <= 19; row++) {
  let rowData = {};
  for (let col = 0; col <= 14; col++) {
    const cell = XLSX.utils.encode_cell({ r: row, c: col });
    const cellObj = htSheet[cell];
    if (cellObj?.v !== undefined) {
      rowData[cell] = cellObj.v;
    }
  }
  console.log(`Row ${row + 1}: ${JSON.stringify(rowData)}`);
}

console.log('\n✅ Structure analysis complete\n');
