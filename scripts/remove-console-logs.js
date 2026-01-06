#!/usr/bin/env node

/**
 * Remove console.log statements from TypeScript/JavaScript files
 * Handles multi-line console.log statements safely with proper string/bracket tracking
 */

const fs = require('fs');
const path = require('path');

function findFiles(dir, extensions) {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
      results = results.concat(findFiles(filePath, extensions));
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  }

  return results;
}

// Skip debug utility files that define console.log
const SKIP_FILES = [
  'debug-logger.ts',
  'client-logger.ts',
  'instrumentation.ts'
];

function shouldSkipFile(filePath) {
  return SKIP_FILES.some(skip => filePath.endsWith(skip));
}

function removeConsoleLogs(content) {
  const lines = content.split('\n');
  const newLines = [];
  let inConsoleLog = false;
  let parenCount = 0;
  let consoleStartLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inConsoleLog) {
      // Check if this line starts a console.log
      const consoleMatch = line.match(/^(\s*)console\.log\(/);
      if (consoleMatch) {
        inConsoleLog = true;
        consoleStartLine = i;
        parenCount = 0;

        // Count parens in this line, being careful about strings
        parenCount = countParens(line.substring(line.indexOf('console.log(')));

        // If balanced and ends with semicolon, skip this single line
        if (parenCount === 0 && line.trim().endsWith(';')) {
          inConsoleLog = false;
          continue; // Skip this line
        }
        continue; // Skip this line, continue multi-line
      }

      // Check for console.log not at start of line (e.g., after if statement on same line)
      // But only simple single-line ones: someCode; console.log('x');
      const inlineMatch = line.match(/;\s*console\.log\([^)]*\);?\s*$/);
      if (inlineMatch) {
        // Remove the console.log part
        const newLine = line.replace(/;\s*console\.log\([^)]*\);?\s*$/, ';');
        newLines.push(newLine);
        continue;
      }

      newLines.push(line);
    } else {
      // Inside a multi-line console.log
      parenCount += countParens(line);

      // Check if we've closed all parens
      if (parenCount <= 0) {
        inConsoleLog = false;
        // Check if there's content after the closing );
        const closeMatch = line.match(/\);\s*(.+)$/);
        if (closeMatch && closeMatch[1].trim()) {
          // There's more code after the console.log
          newLines.push(closeMatch[1]);
        }
        // Otherwise skip this line entirely
      }
      // Skip lines while in console.log
    }
  }

  // Clean up multiple empty lines
  let result = newLines.join('\n');
  result = result.replace(/\n{3,}/g, '\n\n');

  return result;
}

// Count opening minus closing parens, accounting for strings
function countParens(str) {
  let count = 0;
  let inString = false;
  let stringChar = null;
  let escaped = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (!inString) {
      if (char === '"' || char === "'" || char === '`') {
        inString = true;
        stringChar = char;
      } else if (char === '(') {
        count++;
      } else if (char === ')') {
        count--;
      }
    } else {
      if (char === stringChar) {
        inString = false;
        stringChar = null;
      }
    }
  }

  return count;
}

// Main
const srcDir = path.join(__dirname, '..', 'src');
const files = findFiles(srcDir, ['.ts', '.tsx']);

let totalRemoved = 0;

for (const file of files) {
  if (shouldSkipFile(file)) {
    console.log(`Skipping: ${file}`);
    continue;
  }

  const content = fs.readFileSync(file, 'utf8');
  const before = (content.match(/console\.log/g) || []).length;

  if (before > 0) {
    const newContent = removeConsoleLogs(content);
    const after = (newContent.match(/console\.log/g) || []).length;

    if (before !== after) {
      fs.writeFileSync(file, newContent);
      console.log(`${file}: removed ${before - after} console.log(s)`);
      totalRemoved += (before - after);
    }
  }
}

console.log(`\nTotal removed: ${totalRemoved}`);
