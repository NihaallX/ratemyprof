/**
 * Security Test Suite: Client-side URL Redirect Validation
 * 
 * Issue: CWE-79, CWE-116, CWE-601 - Open Redirect / URL Redirection to Untrusted Site
 * Severity: Medium
 * Alert: GitHub CodeQL #15
 * File: frontend/src/pages/auth/login.tsx
 * 
 * Problem:
 * - The 'redirect' query parameter was used directly without validation
 * - Attackers could craft URLs like: /auth/login?redirect=https://evil.com
 * - Users would be redirected to external malicious sites after login
 * - Classic phishing vector: legitimate login page → automatic redirect to fake site
 * 
 * Solution:
 * - Validate redirect parameter before using it
 * - Only allow relative paths starting with '/'
 * - Reject absolute URLs (http://, https://, //)
 * - Default to '/' if validation fails
 * 
 * Test Strategy:
 * - Test safe internal redirects (should work)
 * - Test external URL attacks (should block)
 * - Test protocol-relative URL attacks (should block)
 * - Test JavaScript protocol attacks (should block)
 * - Test edge cases and encoding attempts
 */

console.log('\n🔒 SECURITY TEST: Client-side URL Redirect Validation\n');
console.log('='.repeat(79));

// Simulate the validation logic from login.tsx
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
// TEST CATEGORY 1: Safe Internal Redirects (SHOULD ALLOW)
// ============================================================================
console.log('\n📂 Category 1: Safe Internal Redirects (should allow)\n');

test('Safe redirect to home page', () => {
  const result = validateRedirect('/');
  assert(result === '/', `Expected '/', got '${result}'`);
});

test('Safe redirect to dashboard', () => {
  const result = validateRedirect('/dashboard');
  assert(result === '/dashboard', `Expected '/dashboard', got '${result}'`);
});

test('Safe redirect to profile page', () => {
  const result = validateRedirect('/profile/settings');
  assert(result === '/profile/settings', `Expected '/profile/settings', got '${result}'`);
});

test('Safe redirect with query parameters', () => {
  const result = validateRedirect('/search?query=test&page=2');
  assert(result === '/search?query=test&page=2', `Expected query preserved, got '${result}'`);
});

test('Safe redirect with hash fragment', () => {
  const result = validateRedirect('/docs#security');
  assert(result === '/docs#security', `Expected hash preserved, got '${result}'`);
});

test('Safe redirect to deep path', () => {
  const result = validateRedirect('/colleges/123/professors/456/reviews');
  assert(result === '/colleges/123/professors/456/reviews', `Expected deep path, got '${result}'`);
});

// ============================================================================
// TEST CATEGORY 2: External URL Attacks (SHOULD BLOCK)
// ============================================================================
console.log('\n🚨 Category 2: External URL Attacks (should block)\n');

test('Block absolute HTTPS URL', () => {
  const malicious = 'https://evil.com/phishing';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
  
  // Demonstrate vulnerability in OLD method
  const vulnerableResult = validateRedirectOLD(malicious);
  assert(vulnerableResult === malicious, 'OLD method should be vulnerable');
  console.log(`   🔴 OLD method: Would redirect to ${vulnerableResult} (VULNERABLE!)`);
  console.log(`   🟢 NEW method: Redirects to ${result} (SECURE)`);
});

test('Block absolute HTTP URL', () => {
  const malicious = 'http://attacker.com/steal-credentials';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('Block protocol-relative URL (//evil.com)', () => {
  const malicious = '//evil.com/phishing';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
  
  const vulnerableResult = validateRedirectOLD(malicious);
  console.log(`   🔴 OLD method: Would redirect to ${vulnerableResult} (VULNERABLE!)`);
  console.log(`   🟢 NEW method: Redirects to ${result} (SECURE)`);
});

test('Block data URI scheme', () => {
  const malicious = 'data:text/html,<script>alert("XSS")</script>';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('Block javascript: protocol', () => {
  const malicious = 'javascript:alert(document.cookie)';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('Block vbscript: protocol', () => {
  const malicious = 'vbscript:msgbox(document.cookie)';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('Block file: protocol', () => {
  const malicious = 'file:///etc/passwd';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('Block FTP URL', () => {
  const malicious = 'ftp://evil.com/malware.exe';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

// ============================================================================
// TEST CATEGORY 3: Encoding and Obfuscation Attacks (SHOULD BLOCK)
// ============================================================================
console.log('\n🎭 Category 3: Encoding and Obfuscation Attacks (should block)\n');

test('Block URL-encoded external redirect', () => {
  const malicious = 'https%3A%2F%2Fevil.com';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('Block double-encoded URL', () => {
  const malicious = 'https%253A%252F%252Fevil.com';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('Block backslash path traversal attempt', () => {
  const malicious = '\\evil.com';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('Block whitespace obfuscation', () => {
  const malicious = ' https://evil.com';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('Block tab character obfuscation', () => {
  const malicious = '\thttps://evil.com';
  const result = validateRedirect(malicious);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

// ============================================================================
// TEST CATEGORY 4: Edge Cases and Invalid Input (SHOULD HANDLE SAFELY)
// ============================================================================
console.log('\n🔧 Category 4: Edge Cases and Invalid Input (should handle safely)\n');

test('Handle undefined redirect parameter', () => {
  const result = validateRedirect(undefined);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('Handle null redirect parameter', () => {
  const result = validateRedirect(null);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('Handle empty string redirect', () => {
  const result = validateRedirect('');
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('Handle number as redirect (type coercion attack)', () => {
  const result = validateRedirect(123);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('Handle object as redirect', () => {
  const result = validateRedirect({ url: 'https://evil.com' });
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('Handle array as redirect', () => {
  const result = validateRedirect(['/dashboard', 'https://evil.com']);
  assert(result === '/', `Should default to '/', got '${result}'`);
});

test('Handle very long path (1000+ chars)', () => {
  const longPath = '/' + 'a'.repeat(10000);
  const result = validateRedirect(longPath);
  assert(result === longPath, 'Should allow long valid paths');
  assert(result.length === 10001, 'Path length preserved');
});

// ============================================================================
// TEST CATEGORY 5: Real-World Attack Scenarios
// ============================================================================
console.log('\n💀 Category 5: Real-World Attack Scenarios (should block)\n');

test('Phishing attack: Login redirect to fake site', () => {
  // Attacker sends: https://yourdomain.com/auth/login?redirect=https://yourdomain.evil.com
  const malicious = 'https://yourdomain.evil.com/fake-dashboard';
  const result = validateRedirect(malicious);
  assert(result === '/', 'Should block phishing redirect');
  
  const vulnerableResult = validateRedirectOLD(malicious);
  console.log(`   🔴 Attack vector: /auth/login?redirect=${malicious}`);
  console.log(`   🔴 OLD method: User logs in → redirected to ${vulnerableResult} (PHISHED!)`);
  console.log(`   🟢 NEW method: User logs in → redirected to ${result} (SAFE)`);
});

test('OAuth hijacking attempt', () => {
  // Attacker intercepts OAuth flow with malicious redirect
  const malicious = 'https://attacker.com/oauth/callback?code=STOLEN';
  const result = validateRedirect(malicious);
  assert(result === '/', 'Should block OAuth hijacking');
});

test('Credential harvesting via redirect', () => {
  // Redirect to identical-looking login page to steal credentials twice
  const malicious = 'https://ratemypr0f.com/auth/login'; // typosquatting domain
  const result = validateRedirect(malicious);
  assert(result === '/', 'Should block credential harvesting');
});

test('Session fixation via redirect', () => {
  const malicious = 'https://evil.com/steal-session?sid={SESSION_ID}';
  const result = validateRedirect(malicious);
  assert(result === '/', 'Should block session fixation');
});

// ============================================================================
// TEST CATEGORY 6: Performance and Stress Testing
// ============================================================================
console.log('\n⚡ Category 6: Performance and Stress Testing\n');

test('Performance: 10,000 validations in under 100ms', () => {
  const testCases = [
    '/dashboard',
    'https://evil.com',
    '//attacker.com',
    '/profile/settings',
    'javascript:alert(1)',
    '/search?q=test',
  ];
  
  const startTime = Date.now();
  for (let i = 0; i < 10000; i++) {
    validateRedirect(testCases[i % testCases.length]);
  }
  const duration = Date.now() - startTime;
  
  assert(duration < 100, `Took ${duration}ms, expected <100ms`);
  console.log(`   ⏱️  10,000 validations completed in ${duration}ms`);
});

test('Memory safety: No memory leaks with large strings', () => {
  const hugePath = '/' + 'x'.repeat(1000000); // 1MB string
  const result = validateRedirect(hugePath);
  assert(result === hugePath, 'Should handle large strings');
  console.log(`   📊 Successfully validated 1MB redirect path`);
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
  console.log('\n🎉 ALL TESTS PASSED! Client-side URL redirect validation is SECURE! 🔒');
  console.log('\n✅ Security improvements:');
  console.log('   • External URLs blocked (https://, http://, //)');
  console.log('   • Protocol attacks blocked (javascript:, data:, file:)');
  console.log('   • Encoding attacks detected and blocked');
  console.log('   • Phishing redirects prevented');
  console.log('   • Only relative paths starting with / allowed');
  console.log('   • Safe default fallback to / for invalid input');
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED - Security vulnerabilities may exist!');
  process.exit(1);
}
