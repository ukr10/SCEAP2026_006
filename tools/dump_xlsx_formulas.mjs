#!/usr/bin/env node
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

function dumpFormulas(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return;
  }
  const wb = XLSX.readFile(filePath, { cellStyles: false });
  console.log('\n===', path.basename(filePath), '===');
  console.log('Sheets:', wb.SheetNames.join(', '));
  wb.SheetNames.forEach((sName) => {
    const sheet = wb.Sheets[sName];
    const cellKeys = Object.keys(sheet).filter(k => k[0] !== '!');
    const formulas = cellKeys
      .map(k => ({ k, cell: sheet[k] }))
      .filter(x => x.cell && x.cell.f)
      .slice(0, 200); // limit output
    if (formulas.length === 0) return;
    console.log('\nSheet:', sName, '- formulas found:', formulas.length);
    formulas.forEach(({ k, cell }) => {
      console.log(k, '=>', cell.f);
    });
  });
}

const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error('Usage: node dump_xlsx_formulas.mjs <file1.xlsx> [file2.xlsx]');
  process.exit(1);
}
inputs.forEach(f => dumpFormulas(f));
