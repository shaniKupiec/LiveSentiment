#!/usr/bin/env node

/**
 * LiveSentiment Deployment Test Script
 * 
 * This script helps test the deployment by checking various endpoints
 * and providing debugging information.
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = 'https://livesentiment-backend.onrender.com';
const FRONTEND_URL = 'https://livesentiment-frontend.onrender.com';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      timeout: 30000, // 30 second timeout
      ...options
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test functions
async function testBackendHealth() {
  console.log('🔍 Testing Backend Health Endpoint...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/health`);
    console.log(`✅ Health endpoint: ${response.statusCode}`);
    console.log('📄 Response:', JSON.parse(response.data));
  } catch (error) {
    console.log(`❌ Health endpoint failed: ${error.message}`);
  }
}

async function testBackendDebug() {
  console.log('\n🔍 Testing Backend Debug Endpoint...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/health/debug`);
    console.log(`✅ Debug endpoint: ${response.statusCode}`);
    console.log('📄 Response:', JSON.parse(response.data));
  } catch (error) {
    console.log(`❌ Debug endpoint failed: ${error.message}`);
  }
}

async function testBackendSwagger() {
  console.log('\n🔍 Testing Backend Swagger Documentation (should be disabled in production)...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/docs`);
    if (response.statusCode === 404) {
      console.log('✅ Swagger docs: Correctly disabled in production (404)');
    } else {
      console.log(`⚠️ Swagger docs: ${response.statusCode} - Should be disabled in production`);
    }
  } catch (error) {
    console.log(`✅ Swagger docs: Correctly disabled in production (${error.message})`);
  }
}

async function testBackendRoot() {
  console.log('\n🔍 Testing Backend Root Endpoint...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/`);
    console.log(`✅ Root endpoint: ${response.statusCode}`);
    console.log('📄 Response:', response.data.substring(0, 200) + '...');
  } catch (error) {
    console.log(`❌ Root endpoint failed: ${error.message}`);
  }
}

async function testFrontend() {
  console.log('\n🔍 Testing Frontend...');
  try {
    const response = await makeRequest(`${FRONTEND_URL}/`);
    console.log(`✅ Frontend: ${response.statusCode}`);
    if (response.data.includes('LiveSentiment')) {
      console.log('📄 Frontend loads correctly');
    } else {
      console.log('⚠️ Frontend loads but content might be incorrect');
    }
  } catch (error) {
    console.log(`❌ Frontend failed: ${error.message}`);
  }
}

async function testDatabaseConnection() {
  console.log('\n🔍 Testing Database Connection...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/health`);
    const data = JSON.parse(response.data);
    if (data.database === 'connected') {
      console.log('✅ Database connection: OK');
    } else {
      console.log('❌ Database connection: FAILED');
      console.log('📄 Details:', data);
    }
  } catch (error) {
    console.log(`❌ Database test failed: ${error.message}`);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 LiveSentiment Deployment Test Suite');
  console.log('=====================================');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log('');

  await testBackendRoot();
  await testBackendHealth();
  await testBackendDebug();
  await testBackendSwagger();
  await testDatabaseConnection();
  await testFrontend();

  console.log('\n📋 Test Summary');
  console.log('===============');
  console.log('1. Check if backend is running and accessible');
  console.log('2. Verify database connection');
  console.log('3. Test Swagger documentation access');
  console.log('4. Check frontend deployment');
  console.log('5. Verify CORS configuration');
  
  console.log('\n🔧 Next Steps:');
  console.log('- If backend is not accessible, check Render logs');
  console.log('- If database connection fails, verify environment variables');
  console.log('- If frontend can\'t connect, check CORS and nginx configuration');
  console.log('- Use the debug endpoint to verify all environment variables are set');
}

// Run the tests
runTests().catch(console.error);
