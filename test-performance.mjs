#!/usr/bin/env node

const BASE_URL = 'https://homeserv-live.vercel.app';

async function testPerformance() {
  console.log('⚡ Performance Tests - Load Times & Response Speeds\n');
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  const pages = [
    '/',
    '/auth',
    '/search',
    '/about',
    '/contact',
    '/dashboard',
    '/bookings',
    '/admin',
    '/privacy',
    '/terms'
  ];

  const results = [];
  let totalTime = 0;

  for (const page of pages) {
    try {
      const startTime = performance.now();
      const res = await fetch(`${BASE_URL}${page}`, {
        timeout: 10000
      });
      const endTime = performance.now();
      
      const responseTime = Math.round(endTime - startTime);
      const status = res.status;
      const size = res.headers.get('content-length') || 'unknown';
      
      results.push({
        page,
        status,
        responseTime,
        size
      });
      
      totalTime += responseTime;
      
      // Color coding for performance
      let color = '✓';
      if (responseTime > 2000) color = '⚠️ ';  // Slow
      if (responseTime > 5000) color = '✗';   // Very slow
      
      console.log(`${color} ${page.padEnd(20)} | ${responseTime.toString().padEnd(5)}ms | Status: ${status}`);
    } catch (err) {
      console.log(`✗ ${page.padEnd(20)} | Error: ${err.message}`);
      results.push({
        page,
        status: 'ERROR',
        responseTime: null,
        error: err.message
      });
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 Performance Summary:');
  console.log('═'.repeat(60));
  
  const validResults = results.filter(r => r.responseTime !== null);
  if (validResults.length > 0) {
    const avgTime = Math.round(totalTime / validResults.length);
    const fastest = Math.min(...validResults.map(r => r.responseTime));
    const slowest = Math.max(...validResults.map(r => r.responseTime));
    
    console.log(`⏱️  Average Load Time: ${avgTime}ms`);
    console.log(`⚡ Fastest: ${fastest}ms`);
    console.log(`🐢 Slowest: ${slowest}ms`);
    
    const fastPages = validResults.filter(r => r.responseTime < 1000);
    const mediumPages = validResults.filter(r => r.responseTime >= 1000 && r.responseTime < 2000);
    const slowPages = validResults.filter(r => r.responseTime >= 2000);
    
    console.log(`\n📈 Distribution:`);
    console.log(`  ✓ Fast (<1s): ${fastPages.length}`);
    console.log(`  ⚠️  Medium (1-2s): ${mediumPages.length}`);
    console.log(`  ✗ Slow (>2s): ${slowPages.length}`);
  }
  
  const successCount = results.filter(r => r.status !== 'ERROR').length;
  console.log(`\n✓ Successful: ${successCount}/${results.length}`);
  console.log('═'.repeat(60));
}

testPerformance().catch(console.error);
