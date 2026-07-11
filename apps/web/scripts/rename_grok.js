const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content
    .replace(/Groké/g, 'Wacké AI')
    .replace(/Grok/g, 'AI')
    .replace(/grok/g, 'ai')
    .replace(/GROK/g, 'AI');

  // Let's fix model names to ensure grok-2-1212 isn't broken, wait, "grok-2-1212" becomes "ai-2-1212".
  newContent = newContent.replace(/ai-2-1212/g, 'grok-2-1212');
  newContent = newContent.replace(/ai-beta/g, 'grok-beta');

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !['node_modules', '.next', '.git', 'scripts'].includes(file)) {
      walk(filePath);
    } else if (stat.isFile() && /\.(ts|tsx|js|jsx|css|md)$/.test(filePath)) {
      replaceInFile(filePath);
    }
  }
}

walk("c:\\Users\\north\\Wacke\\apps\\web");
