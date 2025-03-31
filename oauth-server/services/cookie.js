function setSecureCookie(res, token) {
  res.cookie("access_token", token, {
    maxAge: 60 * 60 * 1000,
    secure: true,
  });
}

module.exports = { setSecureCookie };
