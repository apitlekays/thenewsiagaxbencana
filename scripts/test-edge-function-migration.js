#!/usr/bin/env node

/**
 * Edge Function Migration Test Script
 * 
 * This script validates that the new Edge Function implementation
 * produces identical results to the original API route.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Test endpoints
  originalEndpoint: '/api/cron/fetch-vessel-data',
  newEndpoint: '/api/cron/fetch-vessel-data-v2',
  
  // Test parameters
  timeout: 60000, // 60 seconds
  retries: 3,
  
  // Output files
  resultsDir: './test-results',
  originalResultsFile: 'original-api-results.json',
  newResultsFile: 'new-api-results.json',
  comparisonFile: 'migration-comparison.json'
};

/**
 * Make HTTP request with retry logic
 */
async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(CONFIG.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * Test API endpoint with retry logic
 */
async function testEndpoint(baseUrl, endpoint, testName) {
  console.log(`\n🧪 Testing ${testName}: ${endpoint}`);
  
  for (let attempt = 1; attempt <= CONFIG.retries; attempt++) {
    try {
      console.log(`   Attempt ${attempt}/${CONFIG.retries}...`);
      
      const url = `${baseUrl}${endpoint}`;
      const result = await makeRequest(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (result.status === 200) {
        console.log(`   ✅ ${testName} successful (${result.status})`);
        return {
          success: true,
          data: result.data,
          responseTime: Date.now(),
          attempt
        };
      } else {
        console.log(`   ⚠️ ${testName} returned status ${result.status}`);
        if (attempt === CONFIG.retries) {
          return {
            success: false,
            error: `HTTP ${result.status}`,
            data: result.data,
            attempt
          };
        }
      }
    } catch (error) {
      console.log(`   ❌ ${testName} attempt ${attempt} failed: ${error.message}`);
      if (attempt === CONFIG.retries) {
        return {
          success: false,
          error: error.message,
          attempt
        };
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
}

/**
 * Compare results between original and new implementations
 */
function compareResults(originalResult, newResult) {
  const comparison = {
    timestamp: new Date().toISOString(),
    overallSuccess: originalResult.success && newResult.success,
    differences: [],
    warnings: [],
    summary: {}
  };
  
  // Compare success status
  if (originalResult.success !== newResult.success) {
    comparison.differences.push({
      field: 'success',
      original: originalResult.success,
      new: newResult.success
    });
  }
  
  // Compare response data structure
  if (originalResult.success && newResult.success) {
    const originalData = originalResult.data;
    const newData = newResult.data;
    
    // Compare summary data
    if (originalData.summary && newData.summary) {
      const summaryFields = ['vesselsProcessed', 'positionsProcessed', 'errors'];
      summaryFields.forEach(field => {
        if (originalData.summary[field] !== newData.summary[field]) {
          comparison.differences.push({
            field: `summary.${field}`,
            original: originalData.summary[field],
            new: newData.summary[field]
          });
        }
      });
      
      // Check if latest timestamp is reasonable (within 1 hour)
      if (originalData.summary.latestTimestamp && newData.summary.latestTimestamp) {
        const originalTime = new Date(originalData.summary.latestTimestamp);
        const newTime = new Date(newData.summary.latestTimestamp);
        const timeDiff = Math.abs(originalTime - newTime);
        const oneHour = 60 * 60 * 1000;
        
        if (timeDiff > oneHour) {
          comparison.warnings.push({
            field: 'latestTimestamp',
            message: 'Timestamp difference exceeds 1 hour',
            original: originalData.summary.latestTimestamp,
            new: newData.summary.latestTimestamp,
            difference: `${Math.round(timeDiff / (60 * 1000))} minutes`
          });
        }
      }
    }
    
    // Performance comparison
    comparison.summary = {
      originalResponseTime: originalResult.responseTime,
      newResponseTime: newResult.responseTime,
      originalAttempts: originalResult.attempt,
      newAttempts: newResult.attempt
    };
  }
  
  return comparison;
}

/**
 * Save results to file
 */
function saveResults(filename, data) {
  const resultsPath = path.join(CONFIG.resultsDir, filename);
  
  // Ensure results directory exists
  if (!fs.existsSync(CONFIG.resultsDir)) {
    fs.mkdirSync(CONFIG.resultsDir, { recursive: true });
  }
  
  fs.writeFileSync(resultsPath, JSON.stringify(data, null, 2));
  console.log(`📁 Results saved to: ${resultsPath}`);
}

/**
 * Main test function
 */
async function runMigrationTest() {
  console.log('🚀 Starting Edge Function Migration Test');
  console.log('==========================================');
  
  // Get base URL from environment or use localhost
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  console.log(`🌐 Testing against: ${baseUrl}`);
  
  try {
    // Test original API endpoint
    const originalResult = await testEndpoint(
      baseUrl, 
      CONFIG.originalEndpoint, 
      'Original API Route'
    );
    
    // Test new API endpoint
    const newResult = await testEndpoint(
      baseUrl, 
      CONFIG.newEndpoint, 
      'New API Route (Edge Function)'
    );
    
    // Compare results
    console.log('\n📊 Comparing Results');
    console.log('====================');
    
    const comparison = compareResults(originalResult, newResult);
    
    // Display results
    console.log(`\n✅ Overall Success: ${comparison.overallSuccess ? 'YES' : 'NO'}`);
    
    if (comparison.differences.length > 0) {
      console.log(`\n⚠️ Found ${comparison.differences.length} differences:`);
      comparison.differences.forEach((diff, index) => {
        console.log(`   ${index + 1}. ${diff.field}:`);
        console.log(`      Original: ${JSON.stringify(diff.original)}`);
        console.log(`      New: ${JSON.stringify(diff.new)}`);
      });
    } else {
      console.log('\n✅ No differences found in response data');
    }
    
    if (comparison.warnings.length > 0) {
      console.log(`\n⚠️ Found ${comparison.warnings.length} warnings:`);
      comparison.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning.message}: ${warning.difference}`);
      });
    }
    
    // Save results
    saveResults(CONFIG.originalResultsFile, originalResult);
    saveResults(CONFIG.newResultsFile, newResult);
    saveResults(CONFIG.comparisonFile, comparison);
    
    // Final recommendation
    console.log('\n🎯 Migration Test Summary');
    console.log('========================');
    
    if (comparison.overallSuccess && comparison.differences.length === 0) {
      console.log('✅ MIGRATION READY: Both endpoints working identically');
      console.log('   Safe to proceed with deployment');
    } else if (comparison.overallSuccess) {
      console.log('⚠️ MIGRATION CAUTION: Endpoints working but with differences');
      console.log('   Review differences before deployment');
    } else {
      console.log('❌ MIGRATION BLOCKED: Issues found with new endpoint');
      console.log('   Fix issues before deployment');
    }
    
    // Exit with appropriate code
    process.exit(comparison.overallSuccess && comparison.differences.length === 0 ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  runMigrationTest();
}

module.exports = {
  runMigrationTest,
  testEndpoint,
  compareResults
};
