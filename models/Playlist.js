import mongoose from "mongoose";

const PlaylistSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true },
    description: { type: String, required: false },
    songs: { type: Array, required: false },
    type: { type: String, required: false, enum: ["Private", "Public"], default: "Private" },
    poster: { type: String, required: false, default: "https://res.cloudinary.com/dhlr0ufcb/image/upload/v1742872099/icon_ebgvfw.png" },
}, { timestamps: true });

export default mongoose.models.Playlist || mongoose.model("Playlist", PlaylistSchema);