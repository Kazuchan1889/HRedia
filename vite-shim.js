const crypto = require('crypto');
if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.getRandomValues !== 'function') {
  globalThis.crypto = {
    getRandomValues: (arr) => crypto.randomFillSync(arr)
  };
}
