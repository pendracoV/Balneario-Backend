module.exports = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !req.user.Roles) {
    return res.status(401).json({ message: 'Acceso denegado' });
  }
  const userRoles = req.user.Roles.map(r => r.name);
  const ok = userRoles.some(r => allowedRoles.includes(r));
  if (!ok) return res.status(403).json({ message: 'Acceso denegado' });
  next();
};
