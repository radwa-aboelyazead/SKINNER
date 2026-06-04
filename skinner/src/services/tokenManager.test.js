import { decodeJwt, isTokenExpired } from './tokenManager';

function assert(condition, message) { if (!condition) throw new Error(message || 'Assertion failed'); }

// Provide btoa/atob fallbacks for Node environment
const _btoa = typeof btoa === 'function' ? btoa : (str) => Buffer.from(str, 'utf8').toString('base64');
const _atob = typeof atob === 'function' ? atob : (b) => Buffer.from(b, 'base64').toString('utf8');

(function runTests(){
  console.log('Running tokenManager basic tests...');

  // sample token payload: { "exp": <future> }
  const now = Math.floor(Date.now() / 1000);
  const payload = { exp: now + 60 };
  const payloadStr = _btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) + '.' + _btoa(JSON.stringify(payload)) + '.sig';

  const decoded = decodeJwt(payloadStr);
  assert(decoded && decoded.exp === payload.exp, 'decodeJwt should return payload with exp');

  const notExpired = !isTokenExpired(payloadStr);
  assert(notExpired, 'Token should not be expired');

  const expiredPayload = { exp: now - 60 };
  const expiredToken = _btoa(JSON.stringify({ alg: 'HS256' })) + '.' + _btoa(JSON.stringify(expiredPayload)) + '.sig';
  const isExpired = isTokenExpired(expiredToken);
  assert(isExpired, 'Token should be expired');

  console.log('All tokenManager tests passed.');
})();
