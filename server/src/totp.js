const crypto = require('crypto');

function windowFor(date = new Date(), step = 10) {
  return Math.floor(date.getTime() / 1000 / step);
}

function tokenFor(secret, date = new Date(), step = 10) {
  const w = windowFor(date, step);
  const msg = Buffer.alloc(8);
  msg.writeBigInt64BE(BigInt(w));
  const h = crypto.createHmac('sha256', String(secret)).update(msg).digest('base64url');
  // shorten to 8 chars for QR readability
  return h.slice(0, 8);
}

function isValid(secret, token, step = 10, skew = 1) {
  const now = new Date();
  for (let i = -skew; i <= skew; i++) {
    const t = tokenFor(secret, new Date(now.getTime() + i * step * 1000), step);
    if (t === token) return true;
  }
  return false;
}

module.exports = { tokenFor, isValid, windowFor };
