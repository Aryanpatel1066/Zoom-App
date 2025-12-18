import Message from "../models/Message.js";
export const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const msgs = await Message.find({ room: roomId }).sort({ createdAt: 1 });
    return res.status(200).json({ messages: msgs });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
