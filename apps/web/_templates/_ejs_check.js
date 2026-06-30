const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const templatesDir = path.join(__dirname);
const findFiles = (dir) => {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) {
      files.push(...findFiles(p));
    } else if (p.endsWith('.t')) {
      files.push(p);
    }
  }
  return files;
};

const files = findFiles(templatesDir);
let hasError = false;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  try {
    ejs.compile(content, {filename: file});
    console.log(`OK: ${file}`);
  } catch (error) {
    hasError = true;
    console.error(`ERROR: ${file}`);
    console.error(error.message);
  }
}
process.exit(hasError ? 1 : 0);
