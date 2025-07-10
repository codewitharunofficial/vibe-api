import { connectToDatabase } from "../lib/mongodb.js";
import User from "../models/User.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send({ success: false, message: "Method Not Allowed" });
  }

  try {
    await connectToDatabase();
    const { email, song } = req.body;
    console.log(email, song);
    if (!email || !song) return res.status(400).send({ success: false, message: "Missing fields" });

    const user = await User.findOne({email});
    if (!user) return res.status(404).send({ success: false, message: "User Not Found" });

    console.log("Found USer: ", user);

    const isFavorite = user.favourites.some((fav) => fav.videoId === song.videoId);

    console.log("Is Already Favourite? ", isFavorite);

    if (isFavorite) {
      user.favourites = user.favourites.filter((fav) => fav.videoId !== song.videoId);
      await user.save();
      return res.status(200).send({ success: true, message: "Song removed from favorites", favourites: user.favourites });
    } else {
      user.favourites.push(song);
      await user.save();
      return res.status(200).send({ success: true, message: "Song added to favorites", favourites: user.favourites });
    }
  } catch (error) {
    return res.status(500).send({ success: false, message: "Server error", error: error.message });
  }
}
