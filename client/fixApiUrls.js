/**
 * Script to replace all hardcoded localhost URLs with environment variable
 * Run with: node fixApiUrls.js
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Files to update with their replacements
const replacements = [
    {
        search: /fetch\("http:\/\/localhost:3000/g,
        replace: 'fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}'
    },
    {
        search: /fetch\('http:\/\/localhost:3000/g,
        replace: "fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}"
    },
    {
        search: /fetch\(`http:\/\/localhost:3000/g,
        replace: "fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}"
    }
];

function processFile(filePath) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) {
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Check if file has localhost:3000
    if (content.includes('localhost:3000')) {
        console.log(`Processing: ${filePath}`);

        // Add API_URL constant if not present and file uses fetch with localhost
        if (content.includes('fetch("http://localhost:3000') ||
            content.includes("fetch('http://localhost:3000") ||
            content.includes("fetch(`http://localhost:3000")) {

            // Check if API_URL is already defined
            if (!content.includes('const API_URL') && !content.includes('VITE_API_URL')) {
                // Find the last import statement
                const importMatch = content.match(/^import .+;?\s*$/gm);
                if (importMatch) {
                    const lastImport = importMatch[importMatch.length - 1];
                    const insertPoint = content.lastIndexOf(lastImport) + lastImport.length;

                    const apiUrlConst = "\n\nconst API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';\n";
                    content = content.slice(0, insertPoint) + apiUrlConst + content.slice(insertPoint);
                    changed = true;
                }
            }

            // Replace all fetch calls
            content = content.replace(/fetch\("http:\/\/localhost:3000/g, 'fetch(`${API_URL}');
            content = content.replace(/fetch\('http:\/\/localhost:3000/g, 'fetch(`${API_URL}');
            content = content.replace(/fetch\(`http:\/\/localhost:3000/g, 'fetch(`${API_URL}');
            changed = true;
        }

        if (changed) {
            fs.writeFileSync(filePath, content);
            console.log(`  Updated: ${filePath}`);
        }
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            walkDir(filePath);
        } else {
            processFile(filePath);
        }
    }
}

console.log('Starting API URL replacement...\n');
walkDir(srcDir);
console.log('\nDone!');
