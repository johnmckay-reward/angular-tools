const fs = require('fs');
const path = require('path');
const { Project } = require('ts-morph');

// Initialize a ts-morph project
const project = new Project({
  tsConfigFilePath: "tsconfig.json", // adjust if necessary
});

// Recursively find all .component.ts files in a directory
function getComponentFiles(dir) {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(getComponentFiles(fullPath));
    } else if (file.endsWith('.component.ts')) {
      results.push(fullPath);
    }
  });
  return results;
}

// Starting directory (can be passed as the first argument)
const baseDir = process.argv[2] || '.';
const componentFiles = getComponentFiles(baseDir);
console.log(`Found ${componentFiles.length} component file(s).`);

// Report object to collect details for every component processed
const report = [];

componentFiles.forEach(filePath => {
  console.log(`\nProcessing: ${filePath}`);
  const componentReport = {
    filePath,
    removedMethods: [],
    keptMethods: [],
    skipped: false,
  };

  const sourceFile = project.addSourceFileAtPath(filePath);

  // Find the class decorated with @Component
  const componentClass = sourceFile.getClasses().find(cls =>
    cls.getDecorators().some(dec => dec.getName() === 'Component')
  );

  if (!componentClass) {
    console.log('  -> No component class found, skipping.');
    componentReport.skipped = true;
    report.push(componentReport);
    return;
  }

  // Read accompanying HTML file if it exists (assumes same base name with .html)
  const htmlFilePath = filePath.replace('.ts', '.html');
  let htmlContent = "";
  if (fs.existsSync(htmlFilePath)) {
    htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
  }

  // For each method in the class, check if it's used elsewhere
  const methods = componentClass.getMethods();
  methods.forEach(method => {
    const methodName = method.getName();

    if (methodName.startsWith('ng') || methodName.startsWith('ion') || methodName == 'constructor') {
      console.log(`  -> Skipping Angular lifecycle hook: ${methodName}`);
      return;
    }
    
    // Get the full TS file text and count occurrences of the method name
    const tsFullText = sourceFile.getFullText();
    const occurrencesInTs = tsFullText.split(methodName).length - 1;
    const occurrencesInHtml = htmlContent.split(methodName).length - 1;
    
    // Heuristic: if method is declared (1 occurrence) and never used in TS or HTML, remove it
    if (occurrencesInTs <= 1 && occurrencesInHtml === 0) {
      console.log(`  -> Removing unused method: ${methodName}`);
      method.remove();
      componentReport.removedMethods.push(methodName);
    } else {
      console.log(`  -> Keeping method: ${methodName} (used in TS: ${occurrencesInTs - 1} time(s), HTML: ${occurrencesInHtml} time(s))`);
      componentReport.keptMethods.push({
        methodName,
        tsUsage: occurrencesInTs - 1,
        htmlUsage: occurrencesInHtml,
      });
    }
  });

  // Save the modified file
  sourceFile.saveSync();
  report.push(componentReport);
});

console.log('\nProcessing complete.');
console.log('\n--- Report ---\n');

report.forEach(component => {
  console.log(`File: ${component.filePath}`);
  if (component.skipped) {
    console.log('  Skipped: No component class found.');
  } else {
    console.log(`  Removed methods: ${component.removedMethods.join(', ') || 'None'}`);
    if (component.keptMethods.length > 0) {
      console.log(`  Kept methods:`);
      component.keptMethods.forEach(methodInfo => {
        console.log(`    ${methodInfo.methodName} (TS usage: ${methodInfo.tsUsage}, HTML usage: ${methodInfo.htmlUsage})`);
      });
    } else {
      console.log('  Kept methods: None');
    }
  }
  console.log('------------------');
});

console.log('Report generation complete.');
