import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

//generate the accesstoken for short time life span
const generateAccessTokens = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

//generate the refreshtoken for long time life span USERID:PAYLOAD
const generateRefreshTokens = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

// register controller
export const register = async (req, res) => {
  try {
    const { firstName, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "password do not match" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong while register the user" });
  }
};

//login controllers
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email credential" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password credentials" });
    }

    // Generate tokens
    const accessToken = generateAccessTokens(user._id);
    const refreshToken = generateRefreshTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    // Set the refreshtoken in cookie at client side
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        email: user.email,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong while login the user" });
  }
};

//profile controllers
export const profile = async (req, res) => {
  try {
    // send everything except password
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });

  }
  catch (err) {
    return res.status(500)
      .json({ message: "something went wrong while show your profile" })
  }
}

//logout controllers
// export const logout = async (req, res) => {
//   try {
//     res.clearCookie("refreshToken", {
//       httpOnly: true,
//       secure: false,
//       sameSite: "lax",
//       path: "/"
//     });

//     return res.status(200).json({ message: "Logged out successfully" });
//   }
//   catch (err) {
//     return res.status(500)
//       .json({ message: "something went wrong while logout" })
//   }
export const logout = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    const user = await User.findOne({ refreshToken: token });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  res.json({ message: "Logged out successfully" });
};


//refresh token  re-assign the token to access token
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const accessToken = generateAccessTokens(user._id);
    return res.json({ accessToken });
  } catch {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};
