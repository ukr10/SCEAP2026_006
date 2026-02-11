const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../images/11 kV Cable sizing_Updated 3 1.xlsx');
if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(2);
}

const wb = XLSX.readFile(filePath, { cellFormula: true, cellNF: true, cellDates: true });
console.log('SHEETS:', wb.SheetNames.join(', '));

const dumpSheet = (name) => {
  const ws = wb.Sheets[name];
  if (!ws) return;
  const range = ws['!ref'];
  console.log(`\n--- SHEET: ${name}  RANGE: ${range}`);
  const json = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
  // Print first 20 rows
  for (let i = 0; i < Math.min(60, json.length); i++) {
    const row = json[i];
    console.log(`${i+1}`.padStart(3), JSON.stringify(row));
  }
  // Now list any formulas in the sheet
  const formulas = [];
  Object.keys(ws).forEach(k => {
    if (k[0] === '!') return;
    const cell = ws[k];
    if (cell.f) formulas.push({ addr: k, formula: cell.f, value: cell.v });
  });
  console.log(`\nFound ${formulas.length} formulas on sheet ${name}`);
  formulas.slice(0,20).forEach(f => console.log(f.addr, f.formula, '=>', f.value));
};

// target sheets
['HT cable', 'catalogue', 'HT cable '].forEach(name => dumpSheet(name));

// fallback: dump all sheets beginning with 'HT' or 'catalog'
wb.SheetNames.forEach(name => {
  if (/HT|catalog/i.test(name) && !['HT cable','catalogue'].includes(name)) {
    dumpSheet(name);
  }
});

console.log('\nDone');
