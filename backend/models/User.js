import mongoose from 'mongoose'
// this file contain user schema 
const useSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    default: null
  }

}, { timestamps: true, versionKey: false })
export default mongoose.model("User", useSchema)