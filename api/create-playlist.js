import { connectToDatabase } from "../lib/mongodb.js";
import Playlist from "../models/Playlist.js";
import User from "../models/User.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    await connectToDatabase();

    const { id, playlistName, type } = req.body;
    if (!id || !playlistName) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const newPlaylist = new Playlist({ userId: id, name: playlistName, description: "", songs: [], type: type || "Private" });

    await newPlaylist.save();

    const playlists = await Playlist.find({ userId: id });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');


    return res.status(200).json({ success: true, message: "Playlist created", playlists: playlists });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
}
