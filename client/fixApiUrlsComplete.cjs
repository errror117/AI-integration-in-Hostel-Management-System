/**
 * Script to properly fix all API URLs
 * Run with: node fixApiUrlsComplete.cjs
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Keep track of files to fix
const fileFixes = [];

function processFile(filePath) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) {
        return false;
    }
    if (filePath.includes('node_modules')) {
        return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    const originalContent = content;

    // Check if file has any broken patterns
    const hasBrokenPatterns =
        content.includes('`${API_URL}') && content.includes('");') ||
        content.includes("API_URL || 'http://localhost:3000';\n    ") ||
        content.includes("const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';\n    ");

    if (hasBrokenPatterns || content.includes('localhost:3000')) {
        console.log(`Processing: ${path.relative(srcDir, filePath)}`);

        // First, fix any broken template literals ending with ");
        // Pattern: `${API_URL}/path"); -> `${API_URL}/path`);
        content = content.replace(/`\$\{API_URL\}([^`]+)"\)/g, '`${API_URL}$1`)');

        // Fix broken imports where API_URL was inserted in wrong place
        // Pattern: import {\n\nconst API_URL...   should be after the full import
        content = content.replace(
            /import\s*\{[\r\n]+const API_URL = import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3000';[\r\n]/g,
            'import {\n'
        );

        // Remove duplicate or misplaced API_URL definitions
        const apiUrlPattern = /const API_URL = import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3000';/g;
        const matches = content.match(apiUrlPattern);
        if (matches && matches.length > 1) {
            // Remove all but keep one
            let first = true;
            content = content.replace(apiUrlPattern, (match) => {
                if (first) {
                    first = false;
                    return match;
                }
                return '';
            });
            // Clean up empty lines
            content = content.replace(/\n\n\n+/g, '\n\n');
        }

        if (content !== originalContent) {
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  ✅ Fixed: ${path.basename(filePath)}`);
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
            console.error(`Error processing ${filePath}:`, err.message);
        }
    }
    return count;
}

console.log('🔧 Fixing API URL issues...\n');
const count = walkDir(srcDir);
console.log(`\n✅ Done! Fixed ${count} files.`);
