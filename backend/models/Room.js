import mongoose from "mongoose";
// room schema for join particular join room using existing code or new
const RoomSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true }, // short code or UUID
  title: { type: String },
  host: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Room", RoomSchema);
