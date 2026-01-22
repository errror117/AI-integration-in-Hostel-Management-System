/**
 * Replace http://localhost:3000 with window.API_BASE_URL in all JS/JSX files
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function processFile(filePath) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) {
        return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    if (!content.includes('http://localhost:3000')) {
        return false;
    }

    console.log(`Processing: ${path.basename(filePath)}`);

    // Simple replacement: "http://localhost:3000/api/xxx" -> window.API_BASE_URL + "/api/xxx"
    // Pattern 1: fetch("http://localhost:3000/api/something", {
    let changed = content;

    // Replace in fetch calls with double quotes
    changed = changed.replace(
        /fetch\("http:\/\/localhost:3000(\/[^"]+)"/g,
        'fetch(window.API_BASE_URL + "$1"'
    );

    // Replace in fetch calls with single quotes
    changed = changed.replace(
        /fetch\('http:\/\/localhost:3000(\/[^']+)'/g,
        "fetch(window.API_BASE_URL + '$1'"
    );

    // Replace io('http://localhost:3000' for socket
    changed = changed.replace(
        /io\(['"]http:\/\/localhost:3000['"]/g,
        'io(window.API_BASE_URL'
    );

    if (changed !== content) {
        fs.writeFileSync(filePath, changed, 'utf8');
        console.log(`  ✅ Updated: ${path.basename(filePath)}`);
        return true;
    }

    return false;
}

function walkDir(dir) {
    let count = 0;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);

        try {
            const stat = fs.statSync(filePath);

            if (stat.isDirectory() && file !== 'node_modules') {
                count += walkDir(filePath);
            } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
                if (processFile(filePath)) {
                    count++;
                }
            }
        } catch (err) {
            console.error(`Error: ${err.message}`);
        }
    }
    return count;
}

console.log('🔄 Updating API URLs to use window.API_BASE_URL...\n');
const count = walkDir(srcDir);
console.log(`\n✅ Done! Updated ${count} files.`);
