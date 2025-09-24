const { verify } = require("jsonwebtoken");

const validateToken = (req, res, next) => {
  const accessToken = req.header("accessToken");

  if (!accessToken) {
    return res.status(401).json({ error: "User not logged in!" });
  }

  try {
    const validToken = verify(accessToken, "importantsecret");
    req.user = validToken;
    return next();
  } catch (err) {
    // Handle different types of JWT errors
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token has expired" });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token" });
    } else {
      return res.status(401).json({ error: "Token validation failed" });
    }
  }
};

module.exports = { validateToken };
