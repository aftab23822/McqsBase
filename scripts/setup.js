#!/usr/bin/env node

/**
 * Setup Script for Next.js McqsBase Application
 * Automates initial setup and configuration
 * 
 * Usage: npm run setup
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  title: (msg) => console.log(`${colors.bright}${colors.cyan}🚀 ${msg}${colors.reset}\n`)
};

const checkEnvironmentFile = () => {
  log.info('Checking environment configuration...');
  
  const envPath = path.join(projectRoot, '.env.local');
  const examplePath = path.join(projectRoot, 'env.example');
  
  if (fs.existsSync(envPath)) {
    log.success('.env.local already exists');
    return true;
  }
  
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    log.success('.env.local created from env.example');
    log.warning('Please update .env.local with your actual configuration values');
    return false;
  }
  
  log.error('env.example not found');
  return false;
};

const checkDependencies = () => {
  log.info('Checking dependencies...');
  
  const packagePath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(packagePath)) {
    log.error('package.json not found');
    return false;
  }
  
  const nodeModulesPath = path.join(projectRoot, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    log.warning('node_modules not found - run: npm install');
    return false;
  }
  
  log.success('Dependencies are installed');
  return true;
};

const checkNextjsConfig = () => {
  log.info('Checking Next.js configuration...');
  
  const nextConfigPath = path.join(projectRoot, 'next.config.js');
  if (!fs.existsSync(nextConfigPath)) {
    log.error('next.config.js not found');
    return false;
  }
  
  const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
  if (fs.existsSync(tsConfigPath)) {
    log.success('TypeScript configuration found');
  }
  
  log.success('Next.js configuration is ready');
  return true;
};

const checkDirectoryStructure = () => {
  log.info('Checking directory structure...');
  
  const requiredDirs = [
    'app',
    'lib',
    'src/components',
    'public',
    'scripts'
  ];
  
  let allExist = true;
  
  for (const dir of requiredDirs) {
    const dirPath = path.join(projectRoot, dir);
    if (fs.existsSync(dirPath)) {
      log.success(`${dir}/ exists`);
    } else {
      log.error(`${dir}/ missing`);
      allExist = false;
    }
  }
  
  return allExist;
};

const generateJwtSecret = async () => {
  const crypto = await import('crypto');
  return crypto.randomBytes(64).toString('hex');
};

const updateEnvironmentFile = async () => {
  log.info('Updating environment file with secure defaults...');
  
  const envPath = path.join(projectRoot, '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log.error('.env.local not found');
    return false;
  }
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Generate JWT secret if not set
  if (envContent.includes('JWT_SECRET=your-super-secret-jwt-key-change-this-in-production')) {
    const jwtSecret = await generateJwtSecret();
    envContent = envContent.replace(
      'JWT_SECRET=your-super-secret-jwt-key-change-this-in-production',
      `JWT_SECRET=${jwtSecret}`
    );
    log.success('Generated secure JWT secret');
  }
  
  fs.writeFileSync(envPath, envContent);
  return true;
};

const printSetupInstructions = () => {
  console.log('\n' + '='.repeat(60));
  log.title('Setup Complete! Next Steps:');
  
  console.log('1️⃣  Update your environment variables in .env.local:');
  console.log('   - Set your MongoDB connection string');
  console.log('   - Add reCAPTCHA keys (optional)');
  console.log('   - Configure SMTP settings (optional)\n');
  
  console.log('2️⃣  Install dependencies (if not done):');
  console.log('   npm install\n');
  
  console.log('3️⃣  Create admin user:');
  console.log('   node scripts/nextjs-create-admin.js\n');
  
  console.log('4️⃣  Test your setup:');
  console.log('   node scripts/nextjs-test-db.js\n');
  
  console.log('5️⃣  Start development server:');
  console.log('   npm run dev\n');
  
  console.log('6️⃣  Access your application:');
  console.log('   🌐 Frontend: http://localhost:3000');
  console.log('   👨‍💼 Admin Panel: http://localhost:3000/404/admin\n');
  
  console.log('📚 Documentation:');
  console.log('   - API_MIGRATION_STATUS.md - API migration details');
  console.log('   - CONTROLLERS_MIDDLEWARE_MIGRATION.md - Auth & middleware');
  console.log('   - README.md - General information\n');
  
  console.log('🆘 Need help?');
  console.log('   - Run: node scripts/nextjs-test-db.js');
  console.log('   - Check the documentation files');
  console.log('   - Review your .env.local settings\n');
  
  console.log('='.repeat(60) + '\n');
};

const setup = async () => {
  log.title('McqsBase.com Next.js Setup');
  
  const checks = [
    { name: 'Environment File', check: checkEnvironmentFile },
    { name: 'Dependencies', check: checkDependencies },
    { name: 'Next.js Config', check: checkNextjsConfig },
    { name: 'Directory Structure', check: checkDirectoryStructure }
  ];
  
  let allPassed = true;
  
  for (const { name, check } of checks) {
    const passed = check();
    if (!passed) {
      allPassed = false;
    }
    console.log('');
  }
  
  if (allPassed) {
    await updateEnvironmentFile();
    log.success('All setup checks passed!');
  } else {
    log.error('Some setup checks failed. Please resolve the issues above.');
  }
  
  printSetupInstructions();
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Setup interrupted');
  process.exit(0);
});

setup().catch(error => {
  log.error(`Setup failed: ${error.message}`);
  process.exit(1);
});
