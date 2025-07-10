import { connectToDatabase } from "../lib/mongodb.js";
import Playlist from "../models/Playlist.js";
import User from "../models/User.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    await connectToDatabase();

    const { id, song } = req.body;
    // console.log(req.body);
    if (!id || !song) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const updated_playlist = await Playlist.findByIdAndUpdate({ _id: id }, { $addToSet: { songs: song } }, { new: true });
    if (!updated_playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    return res.status(200).json({ success: true, message: "Song added to playlist", playlist: updated_playlist });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
}
