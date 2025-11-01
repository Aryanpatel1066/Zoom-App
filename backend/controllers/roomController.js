import Room from "../models/Room.js";
import { nanoid } from "nanoid"; // npm i nanoid
//create a new room by user
export const createRoom = async (req, res) => {
  try {
    const code = nanoid(8); // short human friendly code
     const room = await Room.create({
      code,
      title: req.body.title || `Meeting-${code}`,
      host: req.user.id,
    });
    return res.status(201).json({ room });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not create room" });
  }
};
//join existing room check code exist or not if not then say not found
export const getRoomByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: "Room not found" });
    return res.status(200).json({ room });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
