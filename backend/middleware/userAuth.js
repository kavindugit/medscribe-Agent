//backend/middleware/userAuth.js
import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not Authorized, Login Again" });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

    if (tokenDecode.id) {
      req.userId = String(tokenDecode.id);   // ✅ always string
      req.user = { id: String(tokenDecode.id) };  // ✅ keep consistent
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Not Authorized, Login Again" });
    }

    next();
  } catch (error) {
    res
      .status(401)
      .json({ success: false, message: error.message });
  }
};

export default userAuth;
