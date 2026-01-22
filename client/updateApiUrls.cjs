/**
 * Script to replace localhost URLs with API_URL import
 * This script properly handles imports and replacements
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function processFile(filePath) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) {
        return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if no localhost:3000
    if (!content.includes('http://localhost:3000')) {
        return false;
    }

    console.log(`Processing: ${path.basename(filePath)}`);

    // Skip if it's a config file itself
    if (filePath.includes('config/api')) {
        return false;
    }

    let changed = false;

    // Check if already has API_URL import
    const hasApiImport = content.includes("from '../config/api'") ||
        content.includes("from '../../config/api'") ||
        content.includes("from '../../../config/api'") ||
        content.includes("from '../../../../config/api'") ||
        content.includes('const API_URL = import.meta.env');

    if (!hasApiImport) {
        // Determine the relative path to config/api.js
        const relativePath = path.relative(path.dirname(filePath), path.join(srcDir, 'config'));
        let importPath = relativePath.replace(/\\/g, '/');
        if (!importPath.startsWith('.')) {
            importPath = './' + importPath;
        }
        importPath += '/api';

        // Add import at the top (after existing imports)
        const importStatement = `import { API_URL } from '${importPath}';\n`;

        // Find the last import statement
        const lines = content.split('\n');
        let lastImportIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('import ') || line.startsWith('import{')) {
                lastImportIndex = i;
                // Handle multi-line imports
                if (!line.includes(';') && !line.endsWith("';") && !line.endsWith('";')) {
                    while (i < lines.length && !lines[i].includes(';')) {
                        i++;
                    }
                    lastImportIndex = i;
                }
            }
        }

        if (lastImportIndex >= 0) {
            lines.splice(lastImportIndex + 1, 0, importStatement.trim());
            content = lines.join('\n');
            changed = true;
        }
    }

    // Now replace all fetch("http://localhost:3000... with fetch(`${API_URL}...
    // Handle different quote styles

    // Pattern 1: fetch("http://localhost:3000/api/something", {
    content = content.replace(
        /fetch\(\s*["']http:\/\/localhost:3000(\/[^"']+)["']\s*,/g,
        'fetch(`${API_URL}$1`,'
    );

    // Pattern 2: fetch("http://localhost:3000/api/something")
    content = content.replace(
        /fetch\(\s*["']http:\/\/localhost:3000(\/[^"']+)["']\s*\)/g,
        'fetch(`${API_URL}$1`)'
    );

    // Pattern 3: io('http://localhost:3000',
    content = content.replace(
        /io\(\s*['"]http:\/\/localhost:3000['"]/g,
        'io(API_URL'
    );

    // Check if anything changed
    if (changed || content.includes('${API_URL}')) {
        fs.writeFileSync(filePath, content, 'utf8');
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

            if (stat.isDirectory() && file !== 'node_modules' && file !== 'config') {
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

console.log('🔄 Updating API URLs...\n');
const count = walkDir(srcDir);
console.log(`\n✅ Done! Updated ${count} files.`);
console.log('\n📝 Remember to add VITE_API_URL environment variable in Render!');
