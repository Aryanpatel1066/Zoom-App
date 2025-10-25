import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  senderName: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Message", MessageSchema);
