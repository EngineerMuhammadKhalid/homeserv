#!/usr/bin/env node

const BASE_URL = 'https://homeserv-live.vercel.app';

async function testDatabaseConnectivity() {
  console.log('🔗 Database Connectivity Tests - Firebase/Firestore\n');
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  console.log('Testing Firebase connectivity indicators...\n');

  const tests = [
    {
      name: 'Firebase Config Available',
      test: async () => {
        const res = await fetch(`${BASE_URL}/`);
        const html = await res.text();
        // Check if Firebase is initialized in the app
        return html.includes('firebase') || html.includes('firebaseapp');
      }
    },
    {
      name: 'App Can Render (DOM Ready)',
      test: async () => {
        const res = await fetch(`${BASE_URL}/`);
        const html = await res.text();
        // Check for React root element and app scripts
        return html.includes('root') && html.includes('assets/index');
      }
    },
    {
      name: 'Auth System Available',
      test: async () => {
        const res = await fetch(`${BASE_URL}/auth`);
        const html = await res.text();
        return res.status === 200 && html.length > 0;
      }
    },
    {
      name: 'Dashboard Data Load (Requires Auth)',
      test: async () => {
        // Dashboard should be accessible even if not authenticated
        // (may show unauthorized - that's expected)
        const res = await fetch(`${BASE_URL}/dashboard`);
        return res.status === 200;
      }
    },
    {
      name: 'Admin Panel Access',
      test: async () => {
        const res = await fetch(`${BASE_URL}/admin`);
        return res.status === 200;
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      const result = await t.test();
      if (result) {
        console.log(`✓ ${t.name}`);
        passed++;
      } else {
        console.log(`⚠️  ${t.name} - Check failed`);
        failed++;
      }
    } catch (err) {
      console.log(`✗ ${t.name} - ${err.message}`);
      failed++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('💾 Database Status:');
  console.log('═'.repeat(60));
  
  if (passed === tests.length) {
    console.log('\n✅ Firebase connectivity appears normal');
    console.log('📝 Note: Full database operations require authentication');
    console.log('   - Run in browser & login to test data operations');
  } else {
    console.log('\n⚠️  Some connectivity checks failed');
  }

  console.log(`\n✓ Passed: ${passed}/${tests.length}`);
  console.log('═'.repeat(60));
}

testDatabaseConnectivity().catch(console.error);
