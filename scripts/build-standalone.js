const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');
const indexPath = path.join(baseDir, 'index.html');
const cssPath = path.join(baseDir, 'styles.css');
const configPath = path.join(baseDir, 'config.js');
const appPath = path.join(baseDir, 'app.js');
const outputPath = path.join(baseDir, 'standalone-dashboard.html');

let html = fs.readFileSync(indexPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const configJs = fs.readFileSync(configPath, 'utf8');
const appJs = fs.readFileSync(appPath, 'utf8');

// Inline CSS
html = html.replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n</style>`);

// Inline config and app JavaScript
html = html.replace('<script src="config.js"></script>', `<script>\n${configJs}\n</script>`);
html = html.replace('<script src="app.js"></script>', `<script>\n${appJs}\n</script>`);

fs.writeFileSync(outputPath, html, 'utf8');
console.log('Successfully generated standalone-dashboard.html! Bytes:', Buffer.byteLength(html, 'utf8'));
