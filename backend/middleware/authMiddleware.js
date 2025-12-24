import jwt from "jsonwebtoken"
// import User from "../models/User"
//protected route wheather it authntic or not
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};


//validate register controller
export const validateRegister = (req, res, next) => {
  const { firstName, email, password, confirmPassword } = req.body;

  // Check missing fields
  if (!firstName || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Password length
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }

  // Password match
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  // All good → go to controller
  next();
};
