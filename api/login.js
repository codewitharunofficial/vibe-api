import { connectToDatabase } from "../lib/mongodb.js";
import User from "../models/User.js";

export default async function handler(req, res) {
  try {
    const { email } = req.body;
    console.log("Email: ", email);

    console.log("Connecting TO DB...");
    await connectToDatabase();
    console.log("Connected TO DB...");

    if (!email) {
      res.status(400).send({ success: false, message: "Email Is Required" });
    } else {
      console.log("Finding User with email: ", email);
      const user = await User.findOne({ email: email });
      if (user) {
        console.log("Found User: ", user);
        res
          .status(200)
          .send({ success: true, message: "Log In SuccessFull", user: user });
      } else {
        console.log("No user Found ");
        res.status(201).send({
          success: false,
          message: "No User With These Credentials Found",
        });
      }
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Something Went Wrong While Logging In",
      error: error,
    });
  }
}
