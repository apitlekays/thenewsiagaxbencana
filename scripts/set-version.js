const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Create .env.local with the version and Supabase configuration
const envContent = `NEXT_PUBLIC_APP_VERSION=${packageJson.version}

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://zdleickljellmrlqeyee.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbGVpY2tsamVsbG1ybHFleWVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NDg5NjQsImV4cCI6MjA3MzQyNDk2NH0.B3iqC5O2L1FgS4Ib7_ogsit8fHSRkwGMZXYz2NmEnTc
`;
const envPath = path.join(__dirname, '..', '.env.local');

fs.writeFileSync(envPath, envContent);

// Update docker-compose.yml with the version from package.json (if it exists)
const dockerComposePath = path.join(__dirname, '..', 'docker-compose.yml');

console.log(`✅ Set NEXT_PUBLIC_APP_VERSION=${packageJson.version} in .env.local`);

if (fs.existsSync(dockerComposePath)) {
  const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8');

  // Replace the NEXT_PUBLIC_APP_VERSION in docker-compose.yml
  const updatedDockerComposeContent = dockerComposeContent.replace(
    /NEXT_PUBLIC_APP_VERSION=\d+\.\d+\.\d+/g,
    `NEXT_PUBLIC_APP_VERSION=${packageJson.version}`
  );

  fs.writeFileSync(dockerComposePath, updatedDockerComposeContent);
  console.log(`✅ Updated docker-compose.yml with NEXT_PUBLIC_APP_VERSION=${packageJson.version}`);
} else {
  console.log(`ℹ️  docker-compose.yml not found, skipping update (this is normal during Docker builds)`);
} 