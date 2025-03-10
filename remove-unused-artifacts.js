#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define regex patterns for Angular artifacts.
const patterns = {
  Component: /\.component\.ts$/,
  Directive: /\.directive\.ts$/,
  Pipe: /\.pipe\.ts$/,
  Service: /\.service\.ts$/,
  Guard: /\.guard\.ts$/,
  Interceptor: /\.interceptor\.ts$/,
  Interface: /\.interface\.ts$/,
  Enum: /\.enum\.ts$/,
};

// Map artifact types to whether the entire directory should be deleted.
const deleteWholeDirMap = {
  Component: true,
  Directive: false,
  Pipe: false,
  Service: false,
  Guard: false,
  Interceptor: false,
  Interface: false,
  Enum: false,
};

let results = []; // Processed artifact summary.
let moduleFiles = []; // List of Angular module files.
const processedDirs = new Set(); // For whole-dir deletions.

// Find all module files (.module.ts) recursively.
function findModules(dir) {
  let modules = [];
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      modules = modules.concat(findModules(fullPath));
    } else if (stat.isFile() && fullPath.endsWith('.module.ts')) {
      modules.push(fullPath);
    }
  });
  return modules;
}

// Remove references to a class from module content (imports and arrays).
function removeClassReference(content, className) {
  let updated = content;
  // Process import statements: remove className, remove line if empty.
  updated = updated.replace(/import\s*\{([^}]+)\}\s*from\s*(['"][^'"]+['"])\s*;/g, (match, imported, fromClause) => {
    let items = imported.split(',').map(x => x.trim());
    let filtered = items.filter(x => x !== className);
    return filtered.length === 0 ? '' : `import { ${filtered.join(', ')} } from ${fromClause};`;
  });
  // Remove className from arrays (declarations, imports, exports).
  updated = updated.replace(new RegExp(`,\\s*${className}`, 'g'), '');
  updated = updated.replace(new RegExp(`${className}\\s*,`, 'g'), '');
  updated = updated.replace(new RegExp(`\\b${className}\\b`, 'g'), '');
  updated = updated.replace(/\[\s*,/g, '[');
  updated = updated.replace(/,\s*\]/g, ']');
  return updated;
}

// Traverse directories to find and process Angular artifacts.
function traverseDir(dir) {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      traverseDir(fullPath);
    } else if (stat.isFile() && path.extname(item) === '.ts') {
      // Skip app.component.ts.
      if (item === 'app.component.ts') return;
      for (const [type, regex] of Object.entries(patterns)) {
        if (regex.test(item)) {
          processArtifact(fullPath, type);
          break;
        }
      }
    }
  });
}

// Process an artifact: update modules, delete it, run build, commit or revert.
function processArtifact(filePath, type) {
  let className = null;
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const match = fileContent.match(/export\s+class\s+(\w+)/);
    if (match && match[1]) {
      className = match[1];
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }

  if (className) {
    moduleFiles.forEach(moduleFile => {
      try {
        let moduleContent = fs.readFileSync(moduleFile, 'utf8');
        if (moduleContent.includes(className)) {
          const updatedContent = removeClassReference(moduleContent, className);
          if (updatedContent !== moduleContent) {
            fs.writeFileSync(moduleFile, updatedContent, 'utf8');
          }
        }
      } catch (err) {
        console.error(`Error updating ${moduleFile}:`, err);
      }
    });
  }

  // Determine deletion target.
  const deleteWholeDir = deleteWholeDirMap[type] || false;
  let targetPath = filePath;
  if (deleteWholeDir) {
    targetPath = path.dirname(filePath);
    if (processedDirs.has(targetPath)) return;
  }

  try {
    if (deleteWholeDir) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(targetPath);
    }
  } catch (err) {
    console.error(`Error deleting ${targetPath}:`, err);
    results.push({ target: targetPath, type, status: 'error deleting' });
    return;
  }

  // Build with "npm run build" and commit if successful.
  try {
    execSync('npm run build', { stdio: 'pipe' });

    // remove evertythign in targetPath before /src/
    const targetPathParts = targetPath.split('/');
    const srcIndex = targetPathParts.indexOf('src');
    const thisTargetPath = targetPathParts.slice(srcIndex).join('/');

    const commitMsg = `chore: Removed unused Angular ${type} (${className || 'unknown'}) at ${thisTargetPath}`;
    execSync(`git add -A && git commit -m "${commitMsg}"`, { stdio: 'pipe' });
    results.push({ target: targetPath, type, status: 'deleted' });
    if (deleteWholeDir) processedDirs.add(targetPath);
    console.log(`Deleted ${targetPath} (${type}).`);
  } catch (buildError) {
    console.error(`Build failed after deleting ${targetPath}. Reverting...`);
    try {
      execSync('git reset --hard HEAD', { stdio: 'pipe' });
      results.push({ target: targetPath, type, status: 'kept' });
    } catch (resetError) {
      console.error(`Error reverting ${targetPath}:`, resetError);
      results.push({ target: targetPath, type, status: 'error reverting' });
    }
  }
}

// Main execution.
console.log('Starting Angular cleanup process...');
moduleFiles = findModules(process.cwd());
console.log(`Found ${moduleFiles.length} module file(s).`);
traverseDir(process.cwd());

console.log('\nSummary:');
results.forEach(result => {
  console.log(`${result.target} (${result.type}): ${result.status}`);
});
fs.writeFileSync('cleanup-results.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Cleanup completed. Results saved to cleanup-results.json.');
