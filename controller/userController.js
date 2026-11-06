
const users = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.registerContoller = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    // Check existing email
    const existingUser = await users.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists. Please login.",
      });
    }

    // Hash password
    const encryptedPassword = await bcrypt.hash(password, 10);

    // Save only if email does not exist
    const newUser = await users.create({
  username,
  email: normalizedEmail,
  password: encryptedPassword,
  role: "user",
});
    

    return res.status(201).json({
      message: "Registration successful!",
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "User already exists. Please login.",
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Registration failed.",
    });
  }
};

exports.loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check whether user is registered
    const existingUser = await users.findOne({
      email: normalizedEmail,
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found. Please register first.",
      });
    }

    // Check password
    const isPasswordMatch = await bcrypt.compare(
  password,
  existingUser.password
);

console.log("Email found:", !!existingUser);
console.log("Password matched:", isPasswordMatch);

if (!isPasswordMatch) {
  return res.status(401).json({
    message: "Invalid email or password.",
  });
}

    // Check JWT secret
    if (!process.env.JWTSECRET) {
      console.error("JWTSECRET is missing in .env");
      return res.status(500).json({
        message: "Server configuration error.",
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        userEmail: existingUser.email,
        role: existingUser.role,
      },
      process.env.JWTSECRET,
      { expiresIn: "1d" }
    );

    // Send response
    return res.status(200).json({
      message: "Login successful!",
      user: {
  _id: existingUser._id,
  username: existingUser.username,
  email: existingUser.email,
  role: existingUser.role,
  profileImage:
    existingUser.profileImage ||
    existingUser.picture ||
    ""
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed. Please try again.",
    });
  }
};
//google login logic

// Google login logic

exports.googleLogin = async (req, res) => {
  try {
    const { username, email, password, picture } = req.body;

    // Validate required fields
    if (!email || !username) {
      return res.status(400).json({
        message: "Username and email are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find existing user
    let existingUser = await users.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      // Update profile picture only when provided
      if (picture && existingUser.profileImage !== picture) {
        existingUser.profileImage = picture;
        await existingUser.save();
      }
    } else {
      // Generate a fallback password if frontend does not send one
      const passwordToHash =
        password || require("crypto").randomBytes(32).toString("hex");

      const encryptedPassword = await bcrypt.hash(
        passwordToHash,
        10
      );

      existingUser = await users.create({
        username,
        email: normalizedEmail,
        password: encryptedPassword,
        profileImage: picture || "",
        role: "user",
      });
    }

    // Check JWT secret
    if (!process.env.JWTSECRET) {
      console.error("JWTSECRET is missing in .env");

      return res.status(500).json({
        message: "Server configuration error: JWTSECRET is missing.",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userEmail: existingUser.email,
        role: existingUser.role || "user",
      },
      process.env.JWTSECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Google login successful",
      user: {
        _id: existingUser._id,
        username: existingUser.username,
        email: existingUser.email,
        role: existingUser.role || "user",
        profileImage: existingUser.profileImage || "",
      },
      token,
    });
  } catch (error) {
    console.error("Google login error:", error);

    return res.status(500).json({
      message: "Google login failed",
      error: error.message,
    });
  }
};


exports.userEditController = async (req, res) => {
  try {
    const { username, picture, profileImage, password, bio } = req.body;
    const { id } = req.params;

    const updateData = {};

    // Update username
    if (username !== undefined) {
      updateData.username = username;
    }

    // Update bio
    // Your schema uses "Bio" with a capital B
    if (bio !== undefined) {
      updateData.Bio = bio;
    }

    // Update profile image
    // Uploaded file takes priority
    if (req.file) {
      updateData.profileImage = req.file.filename;
    } else if (profileImage !== undefined || picture !== undefined) {
      updateData.profileImage = profileImage || picture;
    }

    // Update password only when a new password is provided
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Find user and update MongoDB
    const updatedUser = await users.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    // If user does not exist
    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Send updated user details
    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        bio: updatedUser.Bio || "",
        profileImage: updatedUser.profileImage || "",
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);

    return res.status(500).json({
      message: "Profile update failed",
      error: err.message,
    });
  }
};
exports.getAllUsersController = async (req, res) => {
 console.log("inside getAllUsersController");
 const userlist = await users.find({role: "user"})
 res.status(200).json(userlist)
};