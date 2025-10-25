import express from "express";
import { getMessages } from "../controllers/chatController.js";
import { authnticate } from "../middleware/authMiddleware.js";
const router = express.Router();

router.get("/:roomId", authnticate, getMessages);

export default router;
