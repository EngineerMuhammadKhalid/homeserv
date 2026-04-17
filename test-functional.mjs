#!/usr/bin/env node

const BASE_URL = 'https://homeserv-live.vercel.app';

async function testFunctional() {
  console.log('🧪 Functional Tests - User Interactions\n');
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  const tests = [
    {
      name: 'Homepage loads',
      test: async () => {
        const res = await fetch(`${BASE_URL}/`);
        return res.status === 200 && res.headers.get('content-type')?.includes('text/html');
      }
    },
    {
      name: 'Auth page accessible',
      test: async () => {
        const res = await fetch(`${BASE_URL}/auth`);
        return res.status === 200;
      }
    },
    {
      name: 'Providers list page',
      test: async () => {
        const res = await fetch(`${BASE_URL}/search`);
        return res.status === 200;
      }
    },
    {
      name: 'About page loads',
      test: async () => {
        const res = await fetch(`${BASE_URL}/about`);
        return res.status === 200;
      }
    },
    {
      name: 'Contact page loads',
      test: async () => {
        const res = await fetch(`${BASE_URL}/contact`);
        return res.status === 200;
      }
    },
    {
      name: 'Dashboard accessible',
      test: async () => {
        const res = await fetch(`${BASE_URL}/dashboard`);
        return res.status === 200;
      }
    },
    {
      name: 'Bookings page loads',
      test: async () => {
        const res = await fetch(`${BASE_URL}/bookings`);
        return res.status === 200;
      }
    },
    {
      name: 'Admin panel loads',
      test: async () => {
        const res = await fetch(`${BASE_URL}/admin`);
        return res.status === 200;
      }
    },
    {
      name: 'Privacy Policy accessible',
      test: async () => {
        const res = await fetch(`${BASE_URL}/privacy`);
        return res.status === 200;
      }
    },
    {
      name: 'Terms of Service accessible',
      test: async () => {
        const res = await fetch(`${BASE_URL}/terms`);
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
        console.log(`✗ ${t.name} - returned false`);
        failed++;
      }
    } catch (err) {
      console.log(`✗ ${t.name} - ${err.message}`);
      failed++;
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log(`✓ Passed: ${passed}/${tests.length}`);
  console.log(`✗ Failed: ${failed}/${tests.length}`);
  console.log('═'.repeat(50));

  if (failed === 0) {
    console.log('\n✅ All functional tests passed!');
  }
}

testFunctional().catch(console.error);
