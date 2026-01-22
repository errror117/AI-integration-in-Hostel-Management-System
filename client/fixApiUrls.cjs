/**
 * Script to replace all hardcoded localhost URLs with environment variable
 * Run with: node fixApiUrls.cjs
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function processFile(filePath) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) {
        return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Check if file has localhost:3000
    if (content.includes('localhost:3000')) {
        console.log(`Processing: ${path.basename(filePath)}`);

        // Check if API_URL is already defined
        const hasApiUrl = content.includes('const API_URL') || content.includes("VITE_API_URL ||");

        if (!hasApiUrl) {
            // Find the last import statement
            const lines = content.split('\n');
            let lastImportIndex = -1;

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim().startsWith('import ')) {
                    lastImportIndex = i;
                }
            }

            if (lastImportIndex >= 0) {
                lines.splice(lastImportIndex + 1, 0, "", "const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';");
                content = lines.join('\n');
                changed = true;
            }
        }

        // Replace fetch calls with string literals
        const before = content;
        content = content.replace(/fetch\("http:\/\/localhost:3000/g, 'fetch(`${API_URL}');
        content = content.replace(/fetch\('http:\/\/localhost:3000/g, 'fetch(`${API_URL}');
        content = content.replace(/fetch\(`http:\/\/localhost:3000/g, 'fetch(`${API_URL}');

        if (content !== before) {
            changed = true;
        }

        if (changed) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`  ✅ Updated: ${path.basename(filePath)}`);
            return true;
        }
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
            console.error(`Error processing ${filePath}:`, err.message);
        }
    }
    return count;
}

console.log('🔄 Starting API URL replacement...\n');
const count = walkDir(srcDir);
console.log(`\n✅ Done! Updated ${count} files.`);
