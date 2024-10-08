const User = require("../models/User.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const path = require("path");
const SendVerificationEmail = require("../helper/emailhelper.js");
const axios = require("axios");
const cloudinary = require("../config/cloudinary.js");
const fs = require("fs");


const signupUser = async (req, res) => {
  const { email, password, username, role } = req.body;

  if (!email || !password || !username || !role) {
    return res.status(400).json("Fill all input Fields");
  }

  let profileImage = null;

  if (req.file) {
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_images",
      });

      profileImage = result.secure_url;

      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Failed to delete local file:", err);
      });

    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      return res.status(500).json("Error while uploading profile image");
    }
  }

  const hashedpassword = await bcrypt.hash(password, 10);
  const code = Math.floor(100000 + Math.random() * 900000);

  try {
    await SendVerificationEmail(email, code);
    const user = await User.create({
      username,
      email,
      password: hashedpassword,
      role,
      profileImage,
      code,
    });

    res.status(200).json({ message: "User Created Successfully", user, role });
  } catch (error) {
    console.error("Error during signup:", error);
    if (error.message === "Error sending verification email") {
      return res.status(500).json("Error while sending verification email");
    }
    res.status(500).json("Error while creating a User");
  }
};


const verifyUser = async (req, res) => {
  const { username } = req.params;
  const { code: verificationCode } = req.body; // Destructuring with a clearer name

  try {
    // Find user by username and verification code
    const user = await User.findOne({ username, code: verificationCode });

    // If user is not found or code doesn't match
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid username or verification code" });
    }

    // Mark the user as verified
    user.isVerified = true;
    await user.save();

    // Respond with success message
    res
      .status(200)
      .json({ message: "User verified successfully", username: user.username });
  } catch (error) {
    console.log("Error while verifying the user:", error);
    return res
      .status(500)
      .json({ message: "Error while verifying user", error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password, captcha } = req.body;

    if (!email || !password || !captcha) {
      return res
        .status(400)
        .json("Please fill all the fields and complete the CAPTCHA.");
    }

    // Verify the CAPTCHA with Google's reCAPTCHA API
    const verifyCaptchaResponse = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null, // Since we are sending URL-encoded data, the body is null.
      {
        params: {
          secret: process.env.CAPTCHA_KEY, // Your secret key
          response: captcha, // The user's CAPTCHA response token
        },
      }
    );

    const { success } = verifyCaptchaResponse.data;

    if (captcha.length > 0 && success) {
      const user = await User.findOne({ email, isVerified: true });

      if (!user) {
        return res
          .status(401)
          .json({ message: "User not found or not verified." });
      }

      const passwordCheck = await bcrypt.compare(password, user.password);

      if (!passwordCheck) {
        return res.status(404).json("Password is incorrect");
      }

      const token = jwt.sign(
        {
          username: user.username,
          email: user.email,
          profileImage: user.profileImage,
          role: user.role,
          id: user._id,
        },
        process.env.SECRET_KEY,
        { expiresIn: '1h' }
      );

      const role = user.role;
      const userId = user._id;
      const username = user.username;

      return res
        .cookie("Token", token, {
          httpOnly: true,
          // Add other cookie options as needed for security
        })
        .status(200)
        .json({ message: "You are logged in successfully", token, role, userId, username });
    } else {
      return res.status(400).json("CAPTCHA verification failed.");
    }
  } catch (error) {
    console.log("Error while logging in", error);
    res.status(500).json({ message: "Error while logging in" });
  }
};


const updateUser = async (req, res) => {
  const existingtoken = req.headers.authorization;
  if (!existingtoken) {
    return res.status(401).json("Unauthorized");
  }

  const authToken = existingtoken.split(" ")[1];
  if (!authToken) {
    return res.status(401).json("Unauthorized");
  }

  try {
    const verifytoken = jwt.verify(authToken, process.env.SECRET_KEY);
    const { id } = verifytoken;

    const { email, username, oldpassword, newpassword, role } = req.body;

    const olduser = await User.findById(id);
    if (!olduser) {
      return res.status(404).json("User not found");
    }

    let profileImage = olduser.profileImage; // Initialize with the existing profile image URL

    if (req.file) {
      // If a new profile image is uploaded, delete the old one from Cloudinary
      if (olduser.profileImage) {
        const publicId = olduser.profileImage.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`profile_images/${publicId}`);
      }

      // Upload the new profile image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_images",
      });

      profileImage = result.secure_url;

      // Optionally, delete the local file after uploading to Cloudinary
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Failed to delete local file:", err);
      });
    }

    // Check if oldpassword matches the stored hashed password
    if (oldpassword) {
      const oldpasswordcheck = await bcrypt.compare(
        oldpassword,
        olduser.password
      );
      if (!oldpasswordcheck) {
        return res.status(400).json("Old password is not matched");
      }
    }

    let admin = false;
    if (role === "admin") {
      admin = true;
    }

    const updateData = {};

    // Only include fields in updateData if they are provided in the request body
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (profileImage) updateData.profileImage = profileImage;

    // Update password if newpassword is provided
    if (newpassword) {
      const hashedPassword = await bcrypt.hash(newpassword, 10);
      updateData.password = hashedPassword;
    }

    // Update user in the database
    const newuser = await User.findByIdAndUpdate(id, updateData, { new: true });

    if (!newuser) {
      return res.status(404).json("User not found");
    }

    return res
      .status(200)
      .json({ message: "User updated successfully", newuser, admin });
  } catch (error) {
    console.log("Error while updating the user", error);
    res.status(500).json("An error occurred while updating the user");
  }
};


const deleteUser = async (req, res) => {
  const token = req.headers.authorization;
  console.log(req.body);

  if (!token) {
    return res.status(401).json("Unauthorized");
  }

  const authToken = token.split(" ")[1];

  if (!authToken) {
    return res.status(401).json("Unauthorized");
  }

  try {
    const verifyToken = jwt.verify(authToken, process.env.SECRET_KEY);
    const { id } = verifyToken;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "Error while deleting User" });
    }

    // Assuming user.profileImage contains only the image filename
    const profileImagePath = path.join(
      __dirname,
      "..",
      "public",
      user.profileImage
    ); // Adjust the path as needed

    fs.unlink(profileImagePath, (err) => {
      if (err) {
        console.error("Error while deleting profile image:", err);
      } else {
        console.log("Profile image deleted successfully");
      }
    });

    res.status(200).json({ message: "User deleted Successfully", user });
  } catch (error) {
    console.log("Error while verifying the token", error);
    res.status(500).json("Token is not valid");
  }
};

const profileUser = async (req, res) => {
  const token = req.headers.authorization;
  console.log(req.body);
  console.log(req.headers.authorization);

  if (!token) {
    return res.status(401).json("Unauthorized");
  }

  const authToken = token.split(" ")[1];

  try {
    const verifyToken = jwt.verify(authToken, process.env.SECRET_KEY);
    const { id, role } = verifyToken;

    let admin = false;

    if (role === "admin") {
      admin = true;
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Error while finding  User" });
    }

    res.status(200).json({ user, admin });
  } catch (error) {
    console.log("Error while fetching profile", error);
    res.status(500).json("Error while fetching the User Profile");
  }
};


const AddAddress = async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    console.log(token);

    // Verify and decode the token
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    if (!decodedToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Retrieve user based on decoded token
    const user = await User.findById(decodedToken.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Extract address details from request body
    const { city, country, phone, pinCode } = req.body;

    // Update user's address
    user.address = {
      city,
      country,
      phone,
      pinCode,
    };

    // Save updated user data
    await user.save();

    // Respond with success message
    res.status(200).json({ message: "Address added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const GetAddress = async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    console.log(token);

    // Verify and decode the token
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    if (!decodedToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Retrieve user based on decoded token
    const user = await User.findById(decodedToken.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return user's address information
    res.status(200).json({ address: user.address });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const UpdateAddress = async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    console.log(token);

    // Verify and decode the token
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    if (!decodedToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Retrieve user based on decoded token
    const user = await User.findById(decodedToken.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Extract updated address details from request body
    const { city, country, phone, pinCode } = req.body;

    // Update user's address
    user.address = {
      city,
      country,
      phone,
      pinCode,
    };

    // Save updated user data
    await user.save();

    // Respond with success message
    res.status(200).json({ message: "Address updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const DeleteAddress = async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    console.log(token);

    // Verify and decode the token
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    if (!decodedToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Retrieve user based on decoded token
    const user = await User.findById(decodedToken.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove user's address information
    user.address = undefined;

    // Save updated user data
    await user.save();

    // Respond with success message
    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  loginUser,
  signupUser,
  updateUser,
  deleteUser,
  profileUser,
  AddAddress,
  UpdateAddress,
  GetAddress,
  DeleteAddress,
  verifyUser,
};
