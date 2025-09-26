#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🧪 UNIT TESTS - VITEST');
console.log('=======================');

try {
  if (!existsSync('node_modules/vitest')) {
    console.log('📦 Installing Vitest...');
    execSync('npm install', { stdio: 'inherit' });
  }

  console.log('🏃 Running unit tests...');
  console.log('');

  execSync('npx vitest run', {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('');
  console.log('✅ Unit tests completed successfully!');
  console.log('');
  console.log('📊 Available commands:');
  console.log('  npm run test:unit     - Run unit tests once');
  console.log('  npm run test:coverage - Run tests with coverage');
  console.log('  npm test              - Run tests in watch mode');

} catch (error) {
  console.error('❌ Unit tests failed!');
  console.error(error);
  process.exit(1);
}
