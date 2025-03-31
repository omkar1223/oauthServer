function validateAccessToken(req, res, next) {
  if (!req.cookies.access_token) {
    return res.status(404).json({ error: "Access Denied" });
  }

  next();
}

module.exports = { validateAccessToken };
