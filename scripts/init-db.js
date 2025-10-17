#!/usr/bin/env node

/**
 * Database initialization script
 * This script ensures that the database has the required default configurations
 * Run this after deployment to Heroku or any new environment
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

console.log('Starting database initialization...');
console.log('Target URL:', BASE_URL);

// Parse URL
const url = new URL(`${BASE_URL}/api/init`);
const client = url.protocol === 'https:' ? https : http;

// Make POST request to /api/init
const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = client.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    try {
      const result = JSON.parse(data);
      console.log('Response:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('✅ Database initialization completed successfully!');
        process.exit(0);
      } else {
        console.error('❌ Database initialization failed:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to parse response:', error.message);
      console.error('Raw response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.error('\nMake sure:');
  console.error('1. The application is running');
  console.error('2. MONGODB_URI environment variable is set correctly');
  console.error('3. The database is accessible');
  process.exit(1);
});

req.end();

// Add timeout
setTimeout(() => {
  console.error('❌ Request timeout after 30 seconds');
  process.exit(1);
}, 30000);
