import express from 'express';
import {register,login,profile,logout,refreshToken} from '../controllers/authController.js'
import { validateRegister,authnticate } from '../middleware/authMiddleware.js';
const router = express.Router();

router.post("/register",validateRegister,register)
router.post("/login",login)
router.get("/profile",authnticate,profile)
router.post("/logout",logout)
router.get("/refresh", refreshToken);
export default router;