const admin = require('firebase-admin');

// Initialise Firebase Admin once — idempotent if called multiple times
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    ),
  });
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(header.slice(7));
    req.user = {
      sub: decoded.uid,
      email: decoded.email || '',
      name: decoded.name || '',
      picture: decoded.picture || '',
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
