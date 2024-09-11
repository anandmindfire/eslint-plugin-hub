const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { ruleTemplate } = require('./templates/rule-template');
const { testTemplate } = require('./templates/test-template');

const ruleName = process.argv[2];

if (!ruleName) {
  console.error('Please provide a rule name.');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to convert kebab-case to camelCase
function toCamelCase(str) {
  return str.replace(/-([a-z])/g, g => g[1].toUpperCase());
}

// Function to create files and update index.js
function createRule(ruleType) {
  // Define paths based on rule type
  const rulesDir = path.join(__dirname, '..', 'lib', 'rules', ruleType);
  const ruleFile = path.join(rulesDir, `${ruleName}.js`);
  const testFile = path.join(__dirname, '..', 'test', `${ruleName}.test.js`);
  const indexFile = path.join(__dirname, '..', 'index.js');

  // Ensure the directory exists
  if (!fs.existsSync(rulesDir)) {
    fs.mkdirSync(rulesDir, { recursive: true });
  }

  // Create rule file
  fs.writeFileSync(ruleFile, ruleTemplate(ruleName).trim(), 'utf8');
  console.log(`Rule file created: ${ruleFile}`);

  // Create test file
  fs.writeFileSync(testFile, testTemplate(ruleName).trim(), 'utf8');
  console.log(`Test file created: ${testFile}`);

  // Update index.js
  const indexContent = fs.readFileSync(indexFile, 'utf8');
  const camelCaseRuleName = toCamelCase(ruleName);
  const ruleImport = `const ${camelCaseRuleName} = require('./lib/rules/${ruleType}/${ruleName}');`;

  // New regex pattern to match the entire rules object
  const rulesObjectPattern = /(module\.exports\s*=\s*{\s*rules:\s*{[^}]*})/;

  const updatedIndexContent = indexContent
    .replace(/(const .+ = require\('.+'\);)/, `$1\n${ruleImport}`)
    .replace(rulesObjectPattern, match => {
      // Insert the new rule at the end of the rules object, before the closing brace
      return match.replace(/}(\s*)$/, `  ...${camelCaseRuleName}.rules,\n}$1`);
    });

  fs.writeFileSync(indexFile, updatedIndexContent, 'utf8');
  console.log(`Index file updated: ${indexFile}`);

  rl.close();
}

// Prompt the user to choose between general and react if ruleType is not provided
if (!process.argv[3]) {
  rl.question('Please choose the rule type (general/react): ', answer => {
    const ruleType = answer.toLowerCase();
    if (ruleType === 'general' || ruleType === 'react') {
      createRule(ruleType);
    } else {
      console.error('Invalid rule type. Please choose "general" or "react".');
      process.exit(1);
    }
  });
} else {
  createRule(process.argv[3]);
}
