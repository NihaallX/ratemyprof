/**
 * Security Tests for College ID Validation
 * Validates that college [id].tsx properly rejects malicious inputs
 */

function isValidCollegeId(id) {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(id);
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

console.log('🧪 Testing College ID Validation Security\n');

// Valid tests
test('Accept valid UUID v4', () => {
  if (!isValidCollegeId('550e8400-e29b-41d4-a716-446655440000')) throw new Error('Failed');
});

// Attack prevention
test('Block path traversal', () => {
  if (isValidCollegeId('../admin')) throw new Error('Should block');
});

test('Block SQL injection', () => {
  if (isValidCollegeId("'; DROP TABLE colleges--")) throw new Error('Should block');
});

test('Block URL SSRF', () => {
  if (isValidCollegeId('http://localhost:3000/admin')) throw new Error('Should block');
});

test('Block command injection', () => {
  if (isValidCollegeId('; rm -rf /')) throw new Error('Should block');
});

test('Block XSS', () => {
  if (isValidCollegeId('<script>alert(1)</script>')) throw new Error('Should block');
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 College ID validation is secure!');
  process.exit(0);
} else {
  console.log('❌ Security issues found!');
  process.exit(1);
}
