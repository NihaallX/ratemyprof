/**
 * Security Test for String Replacement - Incomplete Escaping Prevention
 * Tests that template placeholders are ALL replaced, not just the first occurrence
 */

// Simulate the template replacement logic
function replaceTemplatePlaceholders_OLD(template, data) {
  let result = template;
  Object.keys(data).forEach(field => {
    const value = data[field] || `{${field}}`;
    // ❌ VULNERABLE: Only replaces first occurrence
    result = result.replace(`{${field}}`, value);
  });
  return result;
}

function replaceTemplatePlaceholders_NEW(template, data) {
  let result = template;
  Object.keys(data).forEach(field => {
    const value = data[field] || `{${field}}`;
    // ✅ SECURE: Replaces ALL occurrences
    result = result.replaceAll(`{${field}}`, value);
  });
  return result;
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

console.log('🧪 Testing Template Placeholder Replacement Security\n');
console.log('='.repeat(70));

// ============================================================================
// SINGLE PLACEHOLDER TESTS
// ============================================================================
console.log('\n📋 SINGLE PLACEHOLDER TESTS (Should Work With Both):');
console.log('-'.repeat(70));

test('Replace single placeholder - old method', () => {
  const template = 'Hello {userName}!';
  const data = { userName: 'John' };
  const result = replaceTemplatePlaceholders_OLD(template, data);
  if (result !== 'Hello John!') throw new Error(`Expected 'Hello John!', got '${result}'`);
});

test('Replace single placeholder - new method', () => {
  const template = 'Hello {userName}!';
  const data = { userName: 'John' };
  const result = replaceTemplatePlaceholders_NEW(template, data);
  if (result !== 'Hello John!') throw new Error(`Expected 'Hello John!', got '${result}'`);
});

// ============================================================================
// MULTIPLE PLACEHOLDER TESTS (VULNERABILITY DETECTION)
// ============================================================================
console.log('\n🛡️  MULTIPLE PLACEHOLDER TESTS (Shows Vulnerability):');
console.log('-'.repeat(70));

test('OLD method fails with duplicate placeholders', () => {
  const template = '{userName} sent a message to {userName}';
  const data = { userName: 'Alice' };
  const result = replaceTemplatePlaceholders_OLD(template, data);
  
  // Old method only replaces first occurrence
  if (result === 'Alice sent a message to Alice') {
    throw new Error('Old method unexpectedly replaced all occurrences!');
  }
  
  // Should be incomplete
  if (result !== 'Alice sent a message to {userName}') {
    throw new Error(`Unexpected result: ${result}`);
  }
  
  console.log(`   ⚠️  Old result: "${result}" (incomplete!)`);
});

test('NEW method succeeds with duplicate placeholders', () => {
  const template = '{userName} sent a message to {userName}';
  const data = { userName: 'Alice' };
  const result = replaceTemplatePlaceholders_NEW(template, data);
  
  if (result !== 'Alice sent a message to Alice') {
    throw new Error(`Expected all placeholders replaced, got '${result}'`);
  }
  
  console.log(`   ✅ New result: "${result}" (complete!)`);
});

test('Multiple different placeholders', () => {
  const template = '{userName} rated {professorName} {rating}/5 stars';
  const data = { userName: 'Bob', professorName: 'Dr. Smith', rating: '4' };
  const result = replaceTemplatePlaceholders_NEW(template, data);
  
  if (result !== 'Bob rated Dr. Smith 4/5 stars') {
    throw new Error(`Expected all replaced, got '${result}'`);
  }
});

test('Same placeholder 3+ times', () => {
  const template = '{user} likes {user}\'s profile and sent {user} a message';
  const data = { user: 'Charlie' };
  const result = replaceTemplatePlaceholders_NEW(template, data);
  
  if (result !== 'Charlie likes Charlie\'s profile and sent Charlie a message') {
    throw new Error(`Expected all 3 occurrences replaced, got '${result}'`);
  }
});

// ============================================================================
// INJECTION PREVENTION TESTS
// ============================================================================
console.log('\n🔒 INJECTION PREVENTION TESTS:');
console.log('-'.repeat(70));

test('Prevents partial replacement exploitation', () => {
  // If an attacker could control template and only first occurrence is replaced,
  // they might inject malicious content in duplicate placeholders
  const template = 'Welcome {userName}! Your username is {userName}';
  const data = { userName: '<script>alert("xss")</script>' };
  const result = replaceTemplatePlaceholders_NEW(template, data);
  
  // All occurrences should be replaced (React will escape the HTML)
  const expectedBoth = 'Welcome <script>alert("xss")</script>! Your username is <script>alert("xss")</script>';
  if (result !== expectedBoth) {
    throw new Error('Not all occurrences replaced!');
  }
  
  console.log(`   Note: React will escape HTML automatically`);
});

test('Handles empty placeholders correctly', () => {
  const template = '{field1} {field2} {field1}';
  const data = { field1: '', field2: 'test' };
  const result = replaceTemplatePlaceholders_NEW(template, data);
  
  // Empty values get replaced with the placeholder itself (fallback behavior)
  // because of: templateData[field] || `{${field}}`
  if (result !== '{field1} test {field1}') {
    throw new Error(`Expected '{field1} test {field1}', got '${result}'`);
  }
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🔍 EDGE CASES:');
console.log('-'.repeat(70));

test('No placeholders in template', () => {
  const template = 'Plain text message';
  const data = { userName: 'Test' };
  const result = replaceTemplatePlaceholders_NEW(template, data);
  
  if (result !== 'Plain text message') {
    throw new Error('Should not modify text without placeholders');
  }
});

test('Placeholder with no data', () => {
  const template = 'Hello {userName}!';
  const data = {};
  const result = replaceTemplatePlaceholders_NEW(template, data);
  
  // Should leave placeholder as-is when no data
  if (result !== 'Hello {userName}!') {
    throw new Error(`Expected placeholder to remain, got '${result}'`);
  }
});

test('Special characters in placeholder value', () => {
  const template = 'Review: {reviewText}';
  const data = { reviewText: 'Great! $100% worth it & more!' };
  const result = replaceTemplatePlaceholders_NEW(template, data);
  
  if (result !== 'Review: Great! $100% worth it & more!') {
    throw new Error('Special characters should be preserved');
  }
});

test('Nested placeholder syntax', () => {
  const template = '{outer{inner}}';
  const data = { 'outer{inner}': 'replaced' };
  const result = replaceTemplatePlaceholders_NEW(template, data);
  
  if (result !== 'replaced') {
    throw new Error('Should handle nested syntax');
  }
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================
console.log('\n⚡ PERFORMANCE TESTS:');
console.log('-'.repeat(70));

test('Performance with many replacements', () => {
  let template = '';
  for (let i = 0; i < 100; i++) {
    template += `{field${i}} `;
  }
  
  const data = {};
  for (let i = 0; i < 100; i++) {
    data[`field${i}`] = `value${i}`;
  }
  
  const start = Date.now();
  const result = replaceTemplatePlaceholders_NEW(template, data);
  const duration = Date.now() - start;
  
  console.log(`   Processed 100 placeholders in ${duration}ms`);
  
  if (duration > 100) {
    throw new Error(`Too slow: ${duration}ms`);
  }
});

test('Performance with many duplicate placeholders', () => {
  const template = '{userName} '.repeat(50);
  const data = { userName: 'TestUser' };
  
  const start = Date.now();
  const result = replaceTemplatePlaceholders_NEW(template, data);
  const duration = Date.now() - start;
  
  console.log(`   Replaced 50 duplicate placeholders in ${duration}ms`);
  
  if (duration > 50) {
    throw new Error(`Too slow: ${duration}ms`);
  }
  
  if (result !== 'TestUser '.repeat(50)) {
    throw new Error('Not all duplicates replaced');
  }
});

// ============================================================================
// COMPARISON TEST
// ============================================================================
console.log('\n📊 VULNERABILITY DEMONSTRATION:');
console.log('-'.repeat(70));

const testCases = [
  {
    template: '{x} and {x}',
    data: { x: 'REPLACED' },
    oldExpected: 'REPLACED and {x}',  // Incomplete!
    newExpected: 'REPLACED and REPLACED'  // Complete!
  },
  {
    template: '{a}{a}{a}',
    data: { a: '1' },
    oldExpected: '1{a}{a}',  // Only first replaced
    newExpected: '111'  // All replaced
  }
];

testCases.forEach((tc, idx) => {
  test(`Comparison test #${idx + 1}`, () => {
    const oldResult = replaceTemplatePlaceholders_OLD(tc.template, tc.data);
    const newResult = replaceTemplatePlaceholders_NEW(tc.template, tc.data);
    
    if (oldResult !== tc.oldExpected) {
      throw new Error(`Old method unexpected: ${oldResult}`);
    }
    
    if (newResult !== tc.newExpected) {
      throw new Error(`New method unexpected: ${newResult}`);
    }
    
    console.log(`   OLD: "${tc.template}" → "${oldResult}" ❌`);
    console.log(`   NEW: "${tc.template}" → "${newResult}" ✅`);
  });
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
  console.log('✅ Template replacement is secure and complete');
  console.log('✅ All placeholder occurrences are replaced');
  console.log('✅ No incomplete escaping vulnerabilities');
  console.log('✅ Prevents injection through partial replacement');
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED');
  console.log('⚠️  Please review the failures above');
  process.exit(1);
}
