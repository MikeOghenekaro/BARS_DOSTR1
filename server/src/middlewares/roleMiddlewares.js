module.exports = function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.SystemAdmin) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.SystemAdmin.role)) {
      return res.status(403).json({ error: "Forbidden: Access Denied" });
    }

    next();
  };
};
