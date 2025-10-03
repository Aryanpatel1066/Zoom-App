import express from 'express';
import {register,login,profile,logout} from '../controllers/authController.js'
import { validateRegister,authnticate } from '../middleware/authMiddleware.js';
const router = express.Router();

router.post("/register",validateRegister,register)
router.post("/login",login)
router.get("/profile",authnticate,profile)
router.post("/logout",authnticate,logout)
export default router;