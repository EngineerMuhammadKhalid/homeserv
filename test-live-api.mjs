#!/usr/bin/env node

const BASE_URL = 'https://homeserv-live.vercel.app';

async function request(method, path) {
  const url = BASE_URL + path;
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'API-Tester/1.0'
      }
    });

    const contentType = response.headers.get('content-type');
    let body;
    
    if (contentType?.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body,
      contentType
    };
  } catch (err) {
    throw new Error(`Request failed: ${err.message}`);
  }
}

async function runTests() {
  console.log('🧪 Testing Live API Endpoints\n');
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  const tests = [
    { name: 'Health Check', method: 'GET', path: '/api/health' },
    { name: 'Root Path (App)', method: 'GET', path: '/' },
    { name: 'Dashboard', method: 'GET', path: '/dashboard' },
    { name: 'Admin Panel', method: 'GET', path: '/admin' },
    { name: 'Bookings', method: 'GET', path: '/bookings' },
    { name: 'Providers', method: 'GET', path: '/providers' },
    { name: 'Services', method: 'GET', path: '/services' },
    { name: 'Cities', method: 'GET', path: '/cities' },
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`⏳ Testing: ${test.name}`);
      const result = await request(test.method, test.path);
      
      let bodyPreview = '';
      if (typeof result.body === 'string') {
        bodyPreview = result.body.length > 100 
          ? result.body.substring(0, 100) + '...' 
          : result.body.substring(0, 100);
      } else {
        bodyPreview = JSON.stringify(result.body).substring(0, 100) + '...';
      }

      console.log(`  ✓ Status: ${result.status}`);
      console.log(`  ✓ Type: ${result.contentType || 'unknown'}`);
      console.log(`  ✓ Body: ${bodyPreview}`);
      console.log('');
      
      results.push({ test: test.name, status: result.status, success: true });
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}\n`);
      results.push({ test: test.name, status: 'ERROR', success: false });
    }
  }

  console.log('\n📊 Test Summary');
  console.log('═══════════════════════════════════════════════════');
  results.forEach(r => {
    const icon = r.success ? '✓' : '✗';
    console.log(`${icon} ${r.test}: ${r.status}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n✓ Passed: ${successCount}/${results.length}`);
  console.log('═══════════════════════════════════════════════════');
}

runTests().catch(console.error);
