const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const ticket = await client.verifyIdToken({
      idToken: header.slice(7),
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const p = ticket.getPayload();
    req.user = {
      sub: p.sub,
      email: p.email || '',
      name: p.name || '',
      picture: p.picture || '',
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.sub !== process.env.ADMIN_GOOGLE_ID) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  });
}

module.exports = { requireAuth, requireAdmin };
