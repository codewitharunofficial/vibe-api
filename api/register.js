import { connectToDatabase } from "../lib/mongodb.js";
import User from "../models/User.js";

export default async function handler(req, res) {
  try {
    console.log("Connecting TO DB...");
    await connectToDatabase();
    console.log("Connected TO DB...");

    const { name, email, profile } = req.body;

    console.log("data: ", email, name, profile);
    if (!email || !name || !profile) {
      res.status(400).send({ success: false, message: "User Is Required" });
    } else {
      console.log("Registering New User");
      const user = new User({ email: email, name: name, profilePic: profile });
      await user.save();
      if (user) {
        res.status(200).send({
          success: true,
          message: "Registration SuccessFull",
          user: user,
        });
      } else {
        res.status(400).send({
          success: false,
          message: "Error while registering user",
          user: user,
        });
      }
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Something Went Wrong While Registering",
      error: error,
    });
  }
}
