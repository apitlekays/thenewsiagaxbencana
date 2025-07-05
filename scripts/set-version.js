const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Create .env.local with the version
const envContent = `NEXT_PUBLIC_APP_VERSION=${packageJson.version}\n`;
const envPath = path.join(__dirname, '..', '.env.local');

fs.writeFileSync(envPath, envContent);

console.log(`✅ Set NEXT_PUBLIC_APP_VERSION=${packageJson.version} in .env.local`); 