import express from 'express';
import {register,login,profile,logout,refreshToken} from '../controllers/authController.js'
import { validateRegister,authenticate } from '../middleware/authMiddleware.js';
const router = express.Router();

router.post("/register",validateRegister,register)
router.post("/login",login)
router.get("/profile",authenticate,profile)
router.post("/logout",logout)
router.get("/refresh", refreshToken);
export default router;