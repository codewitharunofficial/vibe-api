import { connectToDatabase } from "../lib/mongodb.js";
import User from "../models/User.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }

  try {
    await connectToDatabase();

    const { email } = req.query; // Get email from query params

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Missing email parameter",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Fetched recently played songs",
      recently_played: user.recently_played || [],
    });
  } catch (error) {
    console.error("Error fetching recently played:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}
