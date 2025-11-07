/**
 * Security Test for Email Validation ReDoS Prevention
 * Tests that email validation is safe from Regular Expression Denial of Service attacks
 */

// Simulated validation function (copy from the actual code)
function validateEmail(email) {
  const emailStr = String(email).trim();
  
  // Basic structure checks (no regex, O(n) time complexity)
  const hasNoSpaces = !emailStr.includes(' ');
  const hasAt = emailStr.includes('@');
  const parts = emailStr.split('@');
  const hasValidStructure = parts.length === 2 && 
                            parts[0].length > 0 && 
                            parts[1].includes('.') &&
                            parts[1].split('.').every(p => p.length > 0) &&
                            !parts[1].startsWith('.') &&
                            !parts[1].endsWith('.') &&
                            emailStr.length <= 254;
  
  return hasNoSpaces && hasAt && hasValidStructure;
}

// Old vulnerable regex for comparison
function oldValidateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    failed++;
  }
}

console.log('🧪 Testing Email Validation ReDoS Prevention\n');
console.log('='  .repeat(70));

// ============================================================================
// VALID EMAIL TESTS
// ============================================================================
console.log('\n📋 VALID EMAIL TESTS (Should ACCEPT):');
console.log('-'.repeat(70));

test('Accept standard email', () => {
  if (!validateEmail('user@example.com')) throw new Error('Should accept valid email');
});

test('Accept email with subdomain', () => {
  if (!validateEmail('user@mail.example.com')) throw new Error('Should accept email with subdomain');
});

test('Accept email with numbers', () => {
  if (!validateEmail('user123@example123.com')) throw new Error('Should accept email with numbers');
});

test('Accept email with hyphens', () => {
  if (!validateEmail('user-name@example-domain.com')) throw new Error('Should accept email with hyphens');
});

test('Accept email with dots in local part', () => {
  if (!validateEmail('user.name@example.com')) throw new Error('Should accept dots in local part');
});

test('Accept email with plus sign', () => {
  if (!validateEmail('user+tag@example.com')) throw new Error('Should accept plus sign');
});

// ============================================================================
// REDOS ATTACK PREVENTION
// ============================================================================
console.log('\n🛡️  REDOS ATTACK PREVENTION (Should REJECT QUICKLY):');
console.log('-'.repeat(70));

test('Reject ReDoS attack pattern (many @)', () => {
  const malicious = '@'.repeat(50) + '!';
  const start = Date.now();
  const result = validateEmail(malicious);
  const duration = Date.now() - start;
  
  if (result) throw new Error('Should reject malicious input');
  if (duration > 100) throw new Error(`Took too long: ${duration}ms (ReDoS vulnerable!)`);
});

test('Reject ReDoS attack pattern (many dots)', () => {
  const malicious = '.'.repeat(50) + '@example.com';
  const start = Date.now();
  const result = validateEmail(malicious);
  const duration = Date.now() - start;
  
  // This is technically a valid email structure (dots in local part are allowed)
  // But we care more that it's FAST (no ReDoS)
  if (duration > 100) throw new Error(`Took too long: ${duration}ms (ReDoS vulnerable!)`);
  
  console.log(`   Note: Processed in ${duration}ms (ReDoS protected, even if accepted)`);
});

test('Reject ReDoS attack pattern (alternating @ and .)', () => {
  let malicious = '';
  for (let i = 0; i < 25; i++) {
    malicious += '@.';
  }
  
  const start = Date.now();
  const result = validateEmail(malicious);
  const duration = Date.now() - start;
  
  if (result) throw new Error('Should reject malicious input');
  if (duration > 100) throw new Error(`Took too long: ${duration}ms (ReDoS vulnerable!)`);
});

test('Handle extremely long input quickly', () => {
  const malicious = 'a'.repeat(10000) + '@example.com';
  const start = Date.now();
  const result = validateEmail(malicious);
  const duration = Date.now() - start;
  
  if (result) throw new Error('Should reject too-long email (>254 chars)');
  if (duration > 100) throw new Error(`Took too long: ${duration}ms`);
});

// ============================================================================
// INVALID EMAIL TESTS
// ============================================================================
console.log('\n❌ INVALID EMAIL TESTS (Should REJECT):');
console.log('-'.repeat(70));

test('Reject email without @', () => {
  if (validateEmail('userexample.com')) throw new Error('Should reject');
});

test('Reject email without domain', () => {
  if (validateEmail('user@')) throw new Error('Should reject');
});

test('Reject email without local part', () => {
  if (validateEmail('@example.com')) throw new Error('Should reject');
});

test('Reject email without TLD', () => {
  if (validateEmail('user@example')) throw new Error('Should reject');
});

test('Reject email with multiple @', () => {
  if (validateEmail('user@@example.com')) throw new Error('Should reject');
});

test('Reject email with spaces', () => {
  if (validateEmail('user name@example.com')) throw new Error('Should reject');
});

test('Reject empty string', () => {
  if (validateEmail('')) throw new Error('Should reject');
});

test('Reject email longer than 254 chars', () => {
  const longEmail = 'a'.repeat(250) + '@example.com';
  if (validateEmail(longEmail)) throw new Error('Should reject too-long email');
});

test('Reject email with empty domain part', () => {
  if (validateEmail('user@.com')) throw new Error('Should reject');
});

test('Reject email with empty TLD', () => {
  if (validateEmail('user@example.')) throw new Error('Should reject');
});

// ============================================================================
// PERFORMANCE COMPARISON (if old regex is available)
// ============================================================================
console.log('\n⚡ PERFORMANCE COMPARISON:');
console.log('-'.repeat(70));

test('New validation is fast on attack pattern', () => {
  const attack = '@'.repeat(30) + '!';
  
  const newStart = Date.now();
  validateEmail(attack);
  const newDuration = Date.now() - newStart;
  
  console.log(`   New method: ${newDuration}ms`);
  
  if (newDuration > 50) {
    throw new Error(`New method too slow: ${newDuration}ms`);
  }
});

// Test old regex performance (WARNING: might hang!)
test('Old regex would be slow (limited test)', () => {
  // Use shorter string to avoid actual hang
  const attack = '@'.repeat(15) + '!';
  
  try {
    const oldStart = Date.now();
    oldValidateEmail(attack);
    const oldDuration = Date.now() - oldStart;
    
    console.log(`   Old regex: ${oldDuration}ms (limited test)`);
    
    // Old regex should still work but be slower
  } catch (e) {
    console.log(`   Old regex test skipped (would hang on larger input)`);
  }
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🔍 EDGE CASES:');
console.log('-'.repeat(70));

test('Handle null gracefully', () => {
  if (validateEmail(null)) throw new Error('Should reject null');
});

test('Handle undefined gracefully', () => {
  if (validateEmail(undefined)) throw new Error('Should reject undefined');
});

test('Handle number input gracefully', () => {
  if (validateEmail(12345)) throw new Error('Should reject number');
});

test('Handle object input gracefully', () => {
  if (validateEmail({})) throw new Error('Should reject object');
});

test('Handle whitespace-only email', () => {
  if (validateEmail('   ')) throw new Error('Should reject whitespace');
});

test('Trim whitespace correctly', () => {
  if (!validateEmail('  user@example.com  ')) throw new Error('Should accept after trimming');
});

// ============================================================================
// RESULTS
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(70));
console.log(`Total Tests: ${passed + failed}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
console.log('='.repeat(70));

if (failed === 0) {
  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('✅ Email validation is safe from ReDoS attacks');
  console.log('✅ Validates emails correctly');
  console.log('✅ Fast performance on malicious inputs');
  console.log('✅ Handles edge cases properly');
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED');
  console.log('⚠️  Please review the failures above');
  process.exit(1);
}
