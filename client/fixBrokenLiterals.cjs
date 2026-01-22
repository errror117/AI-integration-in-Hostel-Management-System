/**
 * FIX: Replace broken template literals
 * Pattern: `${API_URL}/something", { -> `${API_URL}/something`, {
 * Pattern: `${API_URL}/something"); -> `${API_URL}/something`);
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function processFile(filePath) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) {
        return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Pattern 1: `${API_URL}/path", { -> `${API_URL}/path`, {
    // This fixes fetch calls with comma after
    content = content.replace(/`\$\{API_URL\}([^`"']+)"\s*,\s*\{/g, '`${API_URL}$1`, {');

    // Pattern 2: `${API_URL}/path'); -> `${API_URL}/path`);
    // This handles single quote variants
    content = content.replace(/`\$\{API_URL\}([^`"']+)'\s*,\s*\{/g, '`${API_URL}$1`, {');

    // Pattern 3: `${API_URL}/path"); -> `${API_URL}/path`);
    // This fixes fetch calls without options
    content = content.replace(/`\$\{API_URL\}([^`"']+)"\s*\)/g, '`${API_URL}$1`)');

    // Pattern 4: `${API_URL}/path'); -> `${API_URL}/path`);
    content = content.replace(/`\$\{API_URL\}([^`"']+)'\s*\)/g, '`${API_URL}$1`)');

    if (content !== original) {
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
            console.error(`Error: ${err.message}`);
        }
    }
    return count;
}

console.log('🔧 Fixing broken template literals...\n');
const count = walkDir(srcDir);
console.log(`\n✅ Done! Fixed ${count} files.`);
