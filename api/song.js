import axios from "axios";
import { connectToDatabase } from "../lib/mongodb.js";
import Song from "../models/Song.js";
import User from "../models/User.js"; // Import User model

export default async function handler(req, res) {
  console.log("Connecting To DB...");
  await connectToDatabase();
  console.log("Connected To DB!");

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }

  const { id, email, song } = req.body; // Accept data from request body
  console.log("Song ID:", id, "User Email:", email);

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');


  try {
    let fetchedSong;
    let existingSong = await Song.findOne({ id });

    if (existingSong) {
      const linkArray = existingSong.song.adaptiveFormats;
      const url = new URL(linkArray[linkArray.length - 1].url);
      const expireTime = url.searchParams.get("expire");
      const currentTimeStamp = Math.floor(Date.now() / 1000);

      if (!expireTime || parseInt(expireTime) <= currentTimeStamp) {
        fetchedSong = await getFromSource(id);
        if (fetchedSong) {
          existingSong = await Song.findOneAndUpdate(
            { id },
            { song: fetchedSong },
            { upsert: true, new: true }
          );
        }
      } else {
        fetchedSong = existingSong.song;
      }
    } else {
      fetchedSong = await getFromSource(id);
      if (fetchedSong) {
        existingSong = await Song.findOneAndUpdate(
          { id },
          { song: fetchedSong },
          { upsert: true, new: true }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: existingSong ? "Song Found In DB" : "Fetched From Source",
      song: fetchedSong,
    });
  } catch (error) {
    console.error("Error fetching song:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

// ✅ Fetch song from external source
const getFromSource = async (id) => {
  console.log("Fetching song from external source...");
  const options = {
    method: "GET",
    url: "https://yt-api.p.rapidapi.com/dl",
    params: { id: id, cgeo: "IN" },
    headers: {
      "x-rapidapi-key": "b1c26628e0msh3fbbf13ea24b4abp184561jsna2ebae86e910",
      "x-rapidapi-host": "yt-api.p.rapidapi.com",
    },
  };

  try {
    const { data } = await axios.request(options);
    if (data.status === "OK") {
      return data;
    }
  } catch (error) {
    console.error("Error fetching from source:", error);
    throw new Error(error.message);
  }
};

// ✅ Update Recently Played & Most Played (Handles Duplicates)
const updateUserHistory = async (email, songData) => {
  try {
    if (!songData) return;

    const user = await User.findOne({ email });

    if (!user) return;

    let recentlyPlayed = user.recently_played || [];
    let mostPlayed = user.most_played || [];

    // 🔹 Remove song if it already exists in recently played, then add at index 0
    recentlyPlayed = recentlyPlayed.filter((item) => item.videoId !== songData.videoId);
    recentlyPlayed.unshift(songData);

    // 🔹 Check if song is already in mostPlayed
    const songIndex = mostPlayed.findIndex((item) => item.videoId === songData.videoId);

    if (songIndex !== -1) {
      // If song exists, increase count
      mostPlayed[songIndex].count += 1;
    } else {
      // If song does not exist, add with count 1
      mostPlayed.push({ ...songData, count: 1 });
    }

    // 🔹 Update user history
    await User.findOneAndUpdate(
      { email },
      {
        $set: { recently_played: recentlyPlayed, most_played: mostPlayed },
      },
      { upsert: true, new: true }
    );

    console.log("Updated user history for:", email);
  } catch (error) {
    console.error("Error updating user history:", error);
  }
};
