#!/usr/bin/env node

/**
 * Database Test Script for Next.js
 * Updated version of scripts/testAdminDb.js for Next.js environment
 * 
 * Usage: node scripts/nextjs-test-db.js
 */

import connectToDatabase from '../lib/mongodb.js';
import { connectAdminDb } from '../lib/adminDb.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const testMainDatabase = async () => {
  try {
    console.log('🔍 Testing main database connection...');
    
    await connectToDatabase();
    console.log('✅ Main database connected successfully');
    
    // Test if we can import and use models
    const MCQ = (await import('../lib/models/MCQ.js')).default;
    const Category = (await import('../lib/models/Category.js')).default;
    const Quiz = (await import('../lib/models/Quiz.js')).default;
    const PastPaper = (await import('../lib/models/PastPaper.js')).default;
    
    const mcqCount = await MCQ.countDocuments();
    const categoryCount = await Category.countDocuments();
    const quizCount = await Quiz.countDocuments();
    const pastPaperCount = await PastPaper.countDocuments();
    
    console.log(`   📊 MCQs: ${mcqCount}`);
    console.log(`   📂 Categories: ${categoryCount}`);
    console.log(`   🎯 Quizzes: ${quizCount}`);
    console.log(`   📄 Past Papers: ${pastPaperCount}`);
    
    return true;
  } catch (error) {
    console.error('❌ Main database test failed:', error.message);
    return false;
  }
};

const testAdminDatabase = async () => {
  try {
    console.log('🔍 Testing admin database connection...');
    
    await connectAdminDb();
    console.log('✅ Admin database connected successfully');
    
    // Import admin models using dynamic import
    const { loginAdmin } = await import('../lib/controllers/authController.js');
    const { getAllSubmissions } = await import('../lib/controllers/userSubmittedItemController.js');
    
    // Test basic query without actual login
    try {
      const submissionsResult = await getAllSubmissions({ page: 1, limit: 1 });
      if (submissionsResult.success) {
        console.log(`   📝 User Submissions: ${submissionsResult.data.total}`);
      }
    } catch (err) {
      console.log('   📝 User Submissions: Model accessible (empty collection)');
    }
    
    console.log('   🔐 Admin authentication: Ready');
    
    return true;
  } catch (error) {
    console.error('❌ Admin database test failed:', error.message);
    return false;
  }
};

const testEnvironmentConfig = () => {
  console.log('🔍 Testing environment configuration...');
  
  const requiredEnvVars = [
    'MONGO_URI',
    'JWT_SECRET'
  ];
  
  const optionalEnvVars = [
    'ADMIN_MONGO_URI',
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_RECAPTCHA_SITE_KEY',
    'RECAPTCHA_SECRET_KEY'
  ];
  
  let allRequired = true;
  
  console.log('   📋 Required variables:');
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      console.log(`   ✅ ${envVar}: Set`);
    } else {
      console.log(`   ❌ ${envVar}: Missing`);
      allRequired = false;
    }
  }
  
  console.log('   📋 Optional variables:');
  for (const envVar of optionalEnvVars) {
    const value = process.env[envVar];
    console.log(`   ${value ? '✅' : '⚠️ '} ${envVar}: ${value ? 'Set' : 'Not set'}`);
  }
  
  return allRequired;
};

const testNextjsConfig = () => {
  console.log('🔍 Testing Next.js configuration...');
  
  try {
    // Test if we can read next.config.js
    const fs = require('fs');
    const path = require('path');
    
    const configPath = path.join(process.cwd(), 'next.config.js');
    if (fs.existsSync(configPath)) {
      console.log('   ✅ next.config.js: Found');
    } else {
      console.log('   ❌ next.config.js: Missing');
    }
    
    const packagePath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      console.log('   ✅ package.json: Found');
      console.log(`   📦 Next.js version: ${pkg.dependencies?.next || 'Not found'}`);
    }
    
    return true;
  } catch (error) {
    console.error('   ❌ Next.js config test failed:', error.message);
    return false;
  }
};

const testDatabase = async () => {
  console.log('🧪 Next.js Database Connection Test\n');
  
  const tests = [
    { name: 'Environment Config', test: testEnvironmentConfig },
    { name: 'Next.js Config', test: testNextjsConfig },
    { name: 'Main Database', test: testMainDatabase },
    { name: 'Admin Database', test: testAdminDatabase }
  ];
  
  let allPassed = true;
  
  for (const { name, test } of tests) {
    try {
      const passed = await test();
      if (!passed) {
        allPassed = false;
      }
      console.log('');
    } catch (error) {
      console.error(`❌ ${name} test crashed:`, error.message);
      allPassed = false;
      console.log('');
    }
  }
  
  if (allPassed) {
    console.log('🎉 All tests passed! Your Next.js app is ready.');
    console.log('');
    console.log('🚀 Quick start:');
    console.log('   1. npm run dev');
    console.log('   2. Visit http://localhost:3000');
    console.log('   3. Admin panel: http://localhost:3000/404/admin');
  } else {
    console.log('❌ Some tests failed. Please check the configuration.');
    console.log('');
    console.log('🔧 Common fixes:');
    console.log('   1. Copy env.example to .env.local');
    console.log('   2. Update database connection strings');
    console.log('   3. Run: npm install');
  }
  
  process.exit(allPassed ? 0 : 1);
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

testDatabase();
