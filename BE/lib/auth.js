const crypto = require('crypto');

// Token ký HMAC đơn giản (id + role + hạn dùng). Đặt AUTH_SECRET trong .env để cố định khoá.
const SECRET = process.env.AUTH_SECRET
  || crypto.createHash('sha256').update(`eparking:${process.env.DB_PASSWORD || ''}:${process.env.DATABASE_URL || ''}`).digest('hex');
const TTL_MS = 12 * 60 * 60 * 1000;

const b64 = (buf) => Buffer.from(buf).toString('base64url');
const sign = (data) => crypto.createHmac('sha256', SECRET).update(data).digest('base64url');

function issueToken(user) {
  const payload = b64(JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + TTL_MS }));
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (typeof token !== 'string') return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

// Token lấy từ header Authorization: Bearer, hoặc ?token= (thẻ <img> không gửi được header).
function requireAdmin(req, res, next) {
  const auth = req.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : req.query.token;
  const data = verifyToken(token);
  if (!data) return res.status(401).json({ message: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' });
  if (data.role !== 'admin') return res.status(403).json({ message: 'Chỉ quản trị viên được phép' });
  req.auth = data;
  next();
}

module.exports = { issueToken, verifyToken, requireAdmin };
