import express from "express";
import { createRoom, getRoomByCode } from "../controllers/roomController.js";
import { authnticate } from "../middleware/authMiddleware.js";
import { validateRoomCreate } from "../middleware/validateRoomCreate.js";
const router = express.Router();

router.post("/", authnticate, validateRoomCreate,createRoom);   // create room
router.get("/code/:code", authnticate, getRoomByCode); // check join validity

export default router;
