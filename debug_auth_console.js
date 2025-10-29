// Paste this in browser console to debug the auth state

console.log('=== AUTH DEBUG ===');
console.log('1. All localStorage keys:', Object.keys(localStorage));

// Check for Supabase session
const supabaseKeys = Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('sb-'));
console.log('2. Supabase-related keys:', supabaseKeys);

supabaseKeys.forEach(key => {
  try {
    const value = localStorage.getItem(key);
    const parsed = JSON.parse(value);
    console.log(`3. ${key}:`, parsed);
  } catch (e) {
    console.log(`3. ${key}: (not JSON)`, localStorage.getItem(key));
  }
});

// Check React auth context state (if available via React DevTools)
console.log('4. Check React DevTools → Components → AuthProvider to see session state');
