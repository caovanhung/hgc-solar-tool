import crypto from 'node:crypto';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SALT_BYTES = 16;
const KEY_BYTES = 64;

export function isHashed(stored: string): boolean {
  return typeof stored === 'string' && stored.startsWith('scrypt$');
}

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_BYTES);
    crypto.scrypt(
      password,
      salt,
      KEY_BYTES,
      { cost: SCRYPT_N, blockSize: SCRYPT_R, parallelization: SCRYPT_P },
      (err, derivedKey) => {
        if (err) return reject(err);
        const saltB64 = salt.toString('base64');
        const hashB64 = derivedKey.toString('base64');
        resolve(`scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${saltB64}$${hashB64}`);
      }
    );
  });
}

export function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return Promise.resolve(false);

  if (!isHashed(stored)) {
    // Legacy plaintext support for initial migration comparison
    return Promise.resolve(stored === password);
  }

  return new Promise((resolve) => {
    const parts = stored.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') {
      return resolve(false);
    }

    const n = parseInt(parts[1], 10);
    const r = parseInt(parts[2], 10);
    const p = parseInt(parts[3], 10);
    const salt = Buffer.from(parts[4], 'base64');
    const expectedHash = Buffer.from(parts[5], 'base64');

    crypto.scrypt(
      password,
      salt,
      expectedHash.length,
      { cost: n, blockSize: r, parallelization: p },
      (err, derivedKey) => {
        if (err) return resolve(false);
        if (derivedKey.length !== expectedHash.length) return resolve(false);
        try {
          const match = crypto.timingSafeEqual(derivedKey, expectedHash);
          resolve(match);
        } catch {
          resolve(false);
        }
      }
    );
  });
}
