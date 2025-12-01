const jwt = require('jsonwebtoken');
require('dotenv').config();

function auth(requiredRole) {
  return function(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('Auth: No authorization header');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Auth: No token in header');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret_absensi_change_me');
      req.user = payload;
      
      // If requiredRole is specified, check if user has that role
      if (requiredRole && payload.role !== requiredRole) {
        console.log(`Auth: Role mismatch. Required: ${requiredRole}, User role: ${payload.role}`);
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // If no requiredRole, allow any authenticated user (admin, user, or head)
      next();
    } catch (err) {
      console.log('Auth: Token verification failed:', err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
  }
}

module.exports = auth;
