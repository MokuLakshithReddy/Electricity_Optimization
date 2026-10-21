/**
 * IntelliGrid AI - Cryptographic Utilities
 *
 * Implements standard FIPS 180-4 SHA-256 cryptographic hashing and HMAC-SHA256.
 * Zero-dependency, portable across Node.js, Web Workers, browser, and SSR environments.
 */

// Initial hash values (first 32 bits of the fractional parts of the square roots of the first 8 primes 2..19)
const H_INIT = new Uint32Array([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);

// Round constants (first 32 bits of the fractional parts of the cube roots of the first 64 primes 2..311)
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(n: number, b: number): number {
  return (n >>> b) | (n << (32 - b));
}

/**
 * Standard FIPS 180-4 SHA-256 Hash Function.
 * Returns a 64-character lowercase hex string.
 */
export function sha256(message: string | Uint8Array): string {
  let bytes: Uint8Array;
  if (typeof message === "string") {
    bytes = new TextEncoder().encode(message);
  } else {
    bytes = message;
  }

  const bitLength = bytes.length * 8;

  // Pre-processing (Padding)
  const remainder = (bytes.length + 9) % 64;
  const paddingLength = remainder === 0 ? 0 : 64 - remainder;
  const totalLength = bytes.length + 1 + paddingLength + 8;
  const padded = new Uint8Array(totalLength);
  padded.set(bytes, 0);
  padded[bytes.length] = 0x80;

  // Append length in bits as 64-bit big-endian integer
  const view = new DataView(padded.buffer);
  view.setUint32(totalLength - 8, Math.floor(bitLength / 0x100000000), false);
  view.setUint32(totalLength - 4, bitLength >>> 0, false);

  // Initialize working variables
  const H = new Uint32Array(H_INIT);
  const W = new Uint32Array(64);

  // Process the message in successive 512-bit (64-byte) chunks
  for (let chunkStart = 0; chunkStart < totalLength; chunkStart += 64) {
    for (let t = 0; t < 16; t++) {
      W[t] = view.getUint32(chunkStart + t * 4, false);
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(W[t - 15], 7) ^ rotr(W[t - 15], 18) ^ (W[t - 15] >>> 3);
      const s1 = rotr(W[t - 2], 17) ^ rotr(W[t - 2], 19) ^ (W[t - 2] >>> 10);
      W[t] = (((W[t - 16] + s0) | 0) + ((W[t - 7] + s1) | 0)) | 0;
    }

    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];
    let f = H[5];
    let g = H[6];
    let h = H[7];

    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (((((h + S1) | 0) + ch) | 0) + ((K[t] + W[t]) | 0)) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;
  }

  // Produce the final 256-bit hash (64 hex characters)
  let hex = "";
  for (let i = 0; i < 8; i++) {
    hex += H[i].toString(16).padStart(8, "0");
  }
  return hex;
}

/**
 * Standard HMAC-SHA256 implementation.
 */
export function hmacSha256(key: string, message: string): string {
  const encoder = new TextEncoder();
  let keyBytes = encoder.encode(key);

  if (keyBytes.length > 64) {
    const keyHashHex = sha256(keyBytes);
    keyBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      keyBytes[i] = parseInt(keyHashHex.substring(i * 2, i * 2 + 2), 16);
    }
  }

  const oKeyPad = new Uint8Array(64);
  const iKeyPad = new Uint8Array(64);

  for (let i = 0; i < 64; i++) {
    const k = i < keyBytes.length ? keyBytes[i] : 0x00;
    oKeyPad[i] = k ^ 0x5c;
    iKeyPad[i] = k ^ 0x36;
  }

  const msgBytes = encoder.encode(message);
  const innerMsg = new Uint8Array(64 + msgBytes.length);
  innerMsg.set(iKeyPad, 0);
  innerMsg.set(msgBytes, 64);
  const innerHashHex = sha256(innerMsg);

  const innerHashBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    innerHashBytes[i] = parseInt(innerHashHex.substring(i * 2, i * 2 + 2), 16);
  }

  const outerMsg = new Uint8Array(64 + 32);
  outerMsg.set(oKeyPad, 0);
  outerMsg.set(innerHashBytes, 64);

  return sha256(outerMsg);
}
