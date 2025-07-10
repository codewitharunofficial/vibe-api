import { connectToDatabase } from "../lib/mongodb.js";
import Playlist from "../models/Playlist.js";
import User from "../models/User.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }

  try {
    await connectToDatabase();

    const { id } = req.query;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    const playlists = await Playlist.find({ userId: id });
    if (playlists.length === 0)
      return res
        .status(201)
        .json({ success: true, message: " No Playlists found", playlists: [] });

    return res.status(200).json({ success: true, message: "Playlists Fetched Successfully", playlists: playlists });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
}
