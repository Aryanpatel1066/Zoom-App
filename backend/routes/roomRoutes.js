import express from "express";
import { createRoom, getRoomByCode } from "../controllers/roomController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { validateRoomCreate } from "../middleware/validateRoomCreate.js";
const router = express.Router();

router.post("/", authenticate, validateRoomCreate,createRoom);   // create room
router.get("/code/:code", authenticate, getRoomByCode); // check join validity

export default router;