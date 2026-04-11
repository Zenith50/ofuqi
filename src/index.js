#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { collectCvData, loadLocale } = require('./prompts');
const { validateCvData } = require('./schema');
const { generateDocx } = require('./generators/docx');
const { generatePdf } = require('./generators/pdf');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

/**
 * Parse CLI arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    fromJson: null,
    format: 'both',
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--from-json':
      case '-j':
        opts.fromJson = args[++i];
        break;
      case '--format':
      case '-f':
        opts.format = args[++i];
        break;
      case '--help':
      case '-h':
        opts.help = true;
        break;
    }
  }

  return opts;
}

/**
 * Print usage help
 */
function printHelp() {
  console.log(`
OC CV Maker - Professional CV Generator (English + Arabic)

Usage:
  node src/index.js                     Interactive mode
  node src/index.js --from-json FILE    Load CV data from JSON file
  node src/index.js --format FORMAT     Output format: docx, pdf, or both (default: both)

Options:
  -j, --from-json FILE    Path to JSON file with CV data
  -f, --format FORMAT     Output format: docx | pdf | both (default: both)
  -h, --help              Show this help message

Examples:
  node src/index.js
  node src/index.js --from-json sample-data.json
  node src/index.js --from-json sample-data.json --format pdf
  node src/index.js -j sample-data-ar.json -f docx
`);
}

/**
 * Generate a safe filename from the person's name
 */
function safeFilename(name) {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50) || 'cv';
}

/**
 * Main entry point
 */
async function main() {
  const opts = parseArgs();

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  console.log('\n========================================');
  console.log('   OC CV Maker');
  console.log('   Professional CV Generator (EN / AR)');
  console.log('========================================\n');

  let data;

  if (opts.fromJson) {
    const jsonPath = path.resolve(opts.fromJson);
    if (!fs.existsSync(jsonPath)) {
      console.error(`Error: File not found: ${jsonPath}`);
      process.exit(1);
    }
    try {
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      data = JSON.parse(raw);
      console.log(`Loaded CV data from: ${jsonPath}`);
    } catch (err) {
      console.error(`Error: Failed to parse JSON: ${err.message}`);
      process.exit(1);
    }
  } else {
    data = await collectCvData();
  }

  const { valid, errors } = validateCvData(data);
  if (!valid) {
    console.error('\nValidation errors:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  const locale = loadLocale(data.language);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const baseName = safeFilename(data.personal.fullName);
  const langSuffix = data.language === 'ar' ? '_ar' : '_en';

  console.log(`\n${locale.prompts.generating}\n`);

  const generated = [];

  if (opts.format === 'both' || opts.format === 'docx') {
    const docxPath = path.join(OUTPUT_DIR, `${baseName}${langSuffix}_CV.docx`);
    try {
      await generateDocx(data, locale, docxPath);
      generated.push(docxPath);
      console.log(`  DOCX: ${locale.prompts.savedTo} ${docxPath}`);
    } catch (err) {
      console.error(`  DOCX Error: ${err.message}`);
    }
  }

  if (opts.format === 'both' || opts.format === 'pdf') {
    const pdfPath = path.join(OUTPUT_DIR, `${baseName}${langSuffix}_CV.pdf`);
    try {
      await generatePdf(data, locale, pdfPath);
      generated.push(pdfPath);
      console.log(`  PDF:  ${locale.prompts.savedTo} ${pdfPath}`);
    } catch (err) {
      console.error(`  PDF Error: ${err.message}`);
    }
  }

  if (generated.length > 0) {
    console.log(`\n${locale.prompts.done}`);
  } else {
    console.error('\nNo files were generated. Check the errors above.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
