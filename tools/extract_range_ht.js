const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const startRow = parseInt(args[0] || '8', 10);
const endRow = parseInt(args[1] || '20', 10);

const filePath = path.resolve(__dirname, '../images/11 kV Cable sizing_Updated 3 1.xlsx');
if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(2);
}

const wb = XLSX.readFile(filePath, { cellFormula: true, cellNF: true, cellDates: true });
const sheetName = wb.SheetNames.find(n => /HT/i.test(n)) || wb.SheetNames[0];
const ws = wb.Sheets[sheetName];
if (!ws) {
  console.error('HT sheet not found');
  process.exit(2);
}

const range = ws['!ref'];
console.log(`Sheet: ${sheetName}  Range: ${range}`);

// print header row (assume first row is header)
const json = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
const header = json[0] || [];
console.log('\nHeader:', header.map((h, i) => `${i+1}:${h}`).join(' | '));

for (let r = startRow; r <= endRow; r++) {
  const rowCells = {};
  // scan columns A to Z then AA to AL (safe range)
  for (let c = 1; c <= 50; c++) {
    const col = XLSX.utils.encode_col(c-1);
    const addr = `${col}${r}`;
    const cell = ws[addr];
    if (cell) {
      rowCells[addr] = { v: cell.v, f: cell.f };
    }
  }
  console.log(`\nRow ${r}:`);
  Object.keys(rowCells).sort().forEach(a => {
    const cell = rowCells[a];
    if (cell.f) {
      console.log(a, 'FORMULA:', cell.f, '=>', cell.v);
    } else {
      console.log(a, 'VALUE :', cell.v);
    }
  });
}

console.log('\nDone');
