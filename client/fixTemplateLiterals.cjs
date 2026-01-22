/**
 * Script to fix broken template literals
 * Run with: node fixTemplateLiterals.cjs
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

    // Fix broken template literals like `${API_URL}/path", { -> `${API_URL}/path`, {
    // Pattern: `${API_URL}...some_path" -> `${API_URL}...some_path`
    const before = content;

    // Fix: fetch(`${API_URL}/api/something", { -> fetch(`${API_URL}/api/something`, {
    content = content.replace(/fetch\(`\$\{API_URL\}([^"]+)"\s*,\s*\{/g, 'fetch(`${API_URL}$1`, {');

    // Fix: fetch(`${API_URL}/api/something', { -> fetch(`${API_URL}/api/something`, {
    content = content.replace(/fetch\(`\$\{API_URL\}([^']+)'\s*,\s*\{/g, 'fetch(`${API_URL}$1`, {');

    if (content !== before) {
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

console.log('🔧 Fixing template literals...\n');
const count = walkDir(srcDir);
console.log(`\n✅ Done! Fixed ${count} files.`);
