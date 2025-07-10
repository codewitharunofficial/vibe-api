import { connectToDatabase } from "../lib/mongodb.js";
import Playlist from "../models/Playlist.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
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


    const playlist = await Playlist.findById({ _id: id });

    if (!playlist) {
      return res
        .status(404)
        .json({ success: false, message: "No playlists found" });
    } else {
      return res.status(200).json({ success: true, message: "Playlist Fetched Successfully", playlist: playlist });
    }

  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
}
