import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

//generate the accesstoken for short time life span
const generateAccessTokens = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
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
     await user.save();

 
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
export const logout = async (req, res) => {
  
  res.json({ message: "Logged out successfully" });
};


 