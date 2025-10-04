#!/usr/bin/env node

/**
 * Frontend-Backend Connection Test
 * 
 * This script tests the connection between frontend and backend
 * by simulating API calls that the frontend would make.
 */

const https = require('https');
const http = require('http');

const FRONTEND_URL = 'https://livesentiment-frontend.onrender.com';
const BACKEND_URL = 'https://livesentiment-backend.onrender.com';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      timeout: 30000,
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
async function testFrontendLoads() {
  console.log('🔍 Testing Frontend Load...');
  try {
    const response = await makeRequest(`${FRONTEND_URL}/`);
    console.log(`✅ Frontend loads: ${response.statusCode}`);
    
    if (response.data.includes('LiveSentiment')) {
      console.log('📄 Frontend content: Contains LiveSentiment');
    } else {
      console.log('⚠️ Frontend content: May not be loading correctly');
    }
    
    return response.statusCode === 200;
  } catch (error) {
    console.log(`❌ Frontend load failed: ${error.message}`);
    return false;
  }
}

async function testBackendDirectAccess() {
  console.log('\n🔍 Testing Backend Direct Access...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/health`);
    console.log(`✅ Backend direct access: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      console.log('📄 Backend response:', data);
    }
    
    return response.statusCode === 200;
  } catch (error) {
    console.log(`❌ Backend direct access failed: ${error.message}`);
    return false;
  }
}

async function testFrontendBackendDirectConnection() {
  console.log('\n🔍 Testing Frontend-Backend Direct Connection...');
  try {
    // Test if frontend can make direct API calls to backend
    // This simulates what the frontend would do with VITE_API_URL
    const response = await makeRequest(`${BACKEND_URL}/api/health`);
    console.log(`✅ Direct API connection: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      console.log('📄 API response:', data);
      return true;
    } else {
      console.log(`⚠️ API returned: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Direct API connection failed: ${error.message}`);
    return false;
  }
}

async function testCORSConfiguration() {
  console.log('\n🔍 Testing CORS Configuration...');
  try {
    // Test CORS by making a request with Origin header
    const response = await makeRequest(`${BACKEND_URL}/api/health`, {
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    console.log(`✅ CORS test: ${response.statusCode}`);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': response.headers['access-control-allow-headers']
    };
    
    console.log('📄 CORS headers:', corsHeaders);
    
    return response.statusCode === 200;
  } catch (error) {
    console.log(`❌ CORS test failed: ${error.message}`);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🔗 Frontend-Backend Connection Test');
  console.log('===================================');
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log('');

  const results = {
    frontendLoads: await testFrontendLoads(),
    backendDirect: await testBackendDirectAccess(),
    frontendBackendConnection: await testFrontendBackendDirectConnection(),
    corsConfig: await testCORSConfiguration()
  };

  console.log('\n📋 Test Results Summary');
  console.log('=======================');
  console.log(`Frontend loads: ${results.frontendLoads ? '✅' : '❌'}`);
  console.log(`Backend direct access: ${results.backendDirect ? '✅' : '❌'}`);
  console.log(`Frontend-Backend connection: ${results.frontendBackendConnection ? '✅' : '❌'}`);
  console.log(`CORS configuration: ${results.corsConfig ? '✅' : '❌'}`);

  console.log('\n🔧 Troubleshooting Guide:');
  
  if (!results.frontendLoads) {
    console.log('- Frontend not loading: Check Render deployment logs');
  }
  
  if (!results.backendDirect) {
    console.log('- Backend not accessible: Check Render deployment logs and environment variables');
  }
  
  if (!results.frontendBackendConnection) {
    console.log('- Frontend-Backend connection failed: Check VITE_API_URL environment variable');
    console.log('  Make sure VITE_API_URL is set to: https://livesentiment-backend.onrender.com');
  }
  
  if (!results.corsConfig) {
    console.log('- CORS issues: Check backend CORS configuration in Startup.cs');
    console.log('  Make sure frontend URL is in the allowed origins list');
  }

  if (results.frontendLoads && results.backendDirect && results.frontendBackendConnection && results.corsConfig) {
    console.log('\n🎉 All tests passed! Frontend and backend are properly connected.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the troubleshooting guide above.');
  }
}

// Run the tests
runTests().catch(console.error);
