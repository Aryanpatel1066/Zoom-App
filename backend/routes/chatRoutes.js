import express from "express";
import { getMessages } from "../controllers/chatController.js";
import { authenticate } from "../middleware/authMiddleware.js";
const router = express.Router();

router.get("/:roomId", authenticate, getMessages);

export default router;
