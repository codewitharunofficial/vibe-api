import { connectToDatabase } from "../lib/mongodb.js";
import User from "../models/User.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send({ success: false, message: "Method Not Allowed" });
  }

  try {
    await connectToDatabase();
    const { email, song } = req.body;
    if (!email || !song) return res.status(400).send({ success: false, message: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).send({ success: false, message: "User Not Found" });

    user.recently_played = user.recently_played.filter((item) => item.videoId !== song.videoId);
    user.recently_played.unshift(song); // Add the song to the beginning of the list
    user.recently_played = user.recently_played.slice(0, 20); // Limit to last 20 songs

    await user.save();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');


    return res.status(200).send({ success: true, message: "Song added to recently played", recentlyPlayed: user.recently_played });
  } catch (error) {
    return res.status(500).send({ success: false, message: "Server error", error: error.message });
  }
}
