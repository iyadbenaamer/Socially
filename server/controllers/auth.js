import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../models/user.js";
import Profile from "../models/profile.js";

import { generateCode } from "../utils/generateCode.js";
import {
  sendAccountVerificationCode,
  sendResetPasswordCode,
} from "../utils/sendEmail.js";
import { handleError } from "../utils/errorHandler.js";

export const signup = async (req, res) => {
  try {
    let { firstName, lastName, email, password, birthDate, gender } = req.body;
    firstName = firstName.trim();
    lastName = lastName.trim();
    email = email.trim().toLowerCase();
    gender = gender.trim().toLowerCase();
    if (!(firstName && lastName && email && password && birthDate && gender)) {
      return res.status(400).json({ message: "Required fields missing." });
    }
    const isEmailUsed = (await User.findOne({ email })) ? true : false;
    if (isEmailUsed) {
      return res.status(409).json({ message: "This email is registered." });
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      password: hashedPassword,
    });

    // create a profile document for the new user with the user's ID
    const profilesCount = await Profile.countDocuments();
    const newProfile = new Profile({
      _id: newUser.id,
      firstName,
      lastName,
      username: `user${profilesCount + 1}`,
      birthDate,
      gender,
    });
    await newProfile.save();

    const verificationCode = generateCode(6);
    const verificationToken = jwt.sign(
      { id: newUser._id, verificationCode },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
      }
    );
    // sends the verification code to the user's email address
    await sendAccountVerificationCode(
      email,
      verificationCode,
      verificationToken
    );

    newUser.verificationStatus.verificationToken = verificationToken;
    await newUser.save();

    return res.status(201).send("user created.");
  } catch (err) {
    return handleError(err, res);
  }
};
export const checkEmailForRegister = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.exists({ email });
    if (user) {
      res
        .status(200)
        .json({ success: false, message: "This email address is registered." });
    } else {
      res
        .status(200)
        .json({ success: true, message: "This email is available." });
    }
  } catch (err) {
    return handleError(err, res);
  }
};

export const checkEmailForResetPassword = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    if (user) {
      res.status(200).json({
        success: true,
        message: "This email address is associated with an account.",
      });
    } else {
      res.status(200).json({
        success: false,
        message: "This email address is not registered.",
      });
    }
  } catch (err) {
    return handleError(err, res);
  }
};

/*LOGIN USER*/
export const login = async (req, res) => {
  try {
    let { email, username, password } = req.body;
    email = email.trim().toLowerCase();
    if (!password && (username || email)) {
      return res.status(400).json({ message: "Invalid credentials." });
    }
    let user;
    if (username && !email) {
      user = await User.findOne({ username });
    } else if (!username && email) {
      user = await User.findOne({ email });
    } else {
      return res.status(400).json({ message: "Invalid login." });
    }
    if (!user) {
      return res.status(404).json({ message: "The user doesn't exist." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }
    const isVerified = user.verificationStatus.isVerified;
    if (!isVerified) {
      const verificationCode = generateCode(6);
      const verificationToken = jwt.sign(
        { id: user.id, verificationCode },
        process.env.JWT_SECRET,
        {
          expiresIn: "10m",
        }
      );
      // send email with verification code if the email isn't verified
      await sendAccountVerificationCode(
        email,
        verificationCode,
        verificationToken
      );
      user.verificationStatus.verificationToken = verificationToken;
      await user.save();
      return res.status(401).json({
        isVerified,
        message: "Verify your account first.",
      });
    }
    /*
    if the email is verified and it's correct as well as the password,
    then a token will be created and returned to the user
    */
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.TOKEN_EXPIRATION,
    });
    res.cookie("token", token, { maxAge: 500000, signed: true });

    const profile = await Profile.findById(user.id);

    // send the users's contact with activity status
    const contactMap = new Map(
      user.contacts.map((c) => [c._id.toString(), c.conversationId])
    );

    const profiles = await Profile.find({
      _id: { $in: Array.from(contactMap.keys()) },
    }).select(
      "id firstName lastName username profilePicPath coverPicPath bio gender followersCount followingCount lastSeenAt"
    );

    const contacts = profiles.map((profile) => {
      const profileObj = profile.toObject();
      return {
        ...profileObj,
        conversationId: contactMap.get(profileObj._id.toString()),
        isOnline: !profile.lastSeenAt,
      };
    });

    return res.status(200).json({
      isVerified,
      token,
      profile,
      contacts,
      unreadMessagesCount: user.unreadMessagesCount,
      unreadNotificationsCount: user.unreadNotificationsCount,
    });
  } catch (err) {
    return handleError(err, res);
  }
};
export const loginWithToken = async (req, res) => {
  try {
    if (req.header("Authorization")) {
      let token = req.header("Authorization");
      if (token.startsWith("Bearer ")) {
        token = token.trimStart().slice(7);
      }
      const userInfo = jwt.verify(token, process.env.JWT_SECRET);
      // send the users's contact with activity status
      const user = await User.findById(userInfo.id);
      const profiles = await Profile.find({
        _id: { $in: user.contacts.map((c) => c._id) },
      }).select(
        "id firstName lastName username profilePicPath coverPicPath bio gender followersCount followingCount lastSeenAt"
      );
      const contacts = profiles.map((profile) => ({
        ...profile.toObject(),
        conversationId: user.contacts.find((c) => c.id === profile.id)
          .conversationId,
        isOnline: profile.lastSeenAt ? false : true,
      }));
      return res.status(200).json({
        contacts,
        unreadMessagesCount: user.unreadMessagesCount,
        unreadNotificationsCount: user.unreadNotificationsCount,
      });
    }
  } catch (err) {
    return handleError(err, res);
  }
};
export const verifyAccountByCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Code cannot be empty." });
    }
    if (!email) {
      return res.status(400).json({ message: "Email cannot be empty." });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (user.verificationStatus.isVerified) {
      return res.status(400).json({
        message: "Account is already verified.",
        alreadyVerified: true,
      });
    }
    /*
      verify the verification code by the token that was created and associated with the code 
      and stored in the database "user.verificationStatus.verificationToken"
      when the user requested for email verification
      */
    try {
      const userInfo = jwt.verify(
        user.verificationStatus.verificationToken,
        process.env.JWT_SECRET
      );
      if (userInfo.verificationCode !== code) {
        return res.status(401).json({ message: "Invalid code." });
      }
      user.verificationStatus.isVerified = true;
      user.verificationStatus.verificationToken = null;
      await user.save();
      const profile = await Profile.findById(user.id);
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.TOKEN_EXPIRATION,
      });
      return res.status(200).json({ profile, isVerified: true, token });
    } catch {
      return res.status(401).json({ message: "jwt expired" });
    }
  } catch (err) {
    return handleError(err, res);
  }
};
export const verifyAccountByToken = async (req, res) => {
  try {
    const { token: verificationToken } = req.query;
    if (!verificationToken) {
      return res.status(400).send("Bad Request");
    }
    const userInfo = jwt.verify(verificationToken, process.env.JWT_SECRET);
    const user = await User.findById(userInfo.id);
    if (!user) {
      return res.status(400).send("Bad Request");
    }
    if (user.verificationStatus.isVerified) {
      return res.status(400).json({
        message: "Account is already verified.",
        alreadyVerified: true,
      });
    }
    if (userInfo.id === user.id) {
      user.verificationStatus.isVerified = true;
      user.verificationStatus.verificationToken = null;
      const profile = await Profile.findById(user.id);
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.TOKEN_EXPIRATION,
      });
      await user.save();
      return res
        .status(200)
        .json({ profile, token, isVerified: true, email: user.email });
    } else {
      return res.status(400).send("Bad Request");
    }
  } catch (err) {
    return handleError(err, res);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;
    if (!token) {
      return res.status(400).send("Bad request");
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }
    try {
      const tokenInfo = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(tokenInfo.id);
      if (!user) {
        return res.status(401).json({ message: "Invalid token" });
      }
      if (user.resetPasswordToken === null) {
        return res.status(400).send("Bad Request.");
      }
      if (user.resetPasswordToken !== token) {
        return res.status(401).json({ message: "Invalid token." });
      }
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);
      user.password = hashedPassword;
      user.resetPasswordToken = null;
      user.verificationStatus.isVerified = true;
      delete user.resetPasswordToken;
      await user.save();
      const profile = await Profile.findById(user.id);
      const loginToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.TOKEN_EXPIRATION,
      });
      return res.status(200).json({
        isVerified: true,
        token: loginToken,
        profile,
      });
    } catch {
      return res
        .status(401)
        .json({ message: "Link is expired.", isExpired: true });
    }
  } catch (err) {
    return handleError(err, res);
  }
};

export const sendVerificationCode = async (req, res) => {
  try {
    let { type, email } = req.body;
    email = email.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const verificationCode = generateCode(6);
    const token = jwt.sign(
      { id: user.id, verificationCode },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
      }
    );
    if (type === "reset_password") {
      await sendResetPasswordCode(email, verificationCode, token);
      user.resetPasswordToken = token;
      user.save();
      return res
        .status(200)
        .json({ message: `We have sent a verification code to ${email}.` });
    } else if (type === "verify_account") {
      await sendAccountVerificationCode(email, verificationCode, token);
      if (user.verificationStatus.isVerified) {
        return res.status(400).json({
          message: "Account is already verified.",
          alreadyVerified: true,
        });
      }
      user.verificationStatus.verificationToken = token;
      user.save();
      return res.status(200).json({ message: "Code sent." });
    } else {
      return res.status(400).send("Bad request");
    }
  } catch (err) {
    return handleError(err, res);
  }
};

export const verifyResetPasswordCode = async (req, res) => {
  try {
    let { code, email } = req.body;
    email = email.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json("Bad Request");
    }
    try {
      const tokenInfo = jwt.verify(
        user.resetPasswordToken,
        process.env.JWT_SECRET
      );
      if (tokenInfo.verificationCode !== code) {
        return res.status(401).json({ message: "Invalid code." });
      }
      return res.status(200).json({ token: user.resetPasswordToken });
    } catch {
      return res.status(401).json({ message: "jwt expired" });
    }
  } catch (err) {
    return handleError(err, res);
  }
};

export const verifyResetPasswordToken = async (req, res) => {
  try {
    let { token: verificationToken } = req.query;
    verificationToken = verificationToken.trim();
    try {
      const tokenInfo = jwt.verify(verificationToken, process.env.JWT_SECRET);
      const user = await User.findById(tokenInfo.id);
      if (!user) {
        return res.status(400).send("Bad Request");
      }

      // Check if the user has a valid reset password token
      if (!user.resetPasswordToken) {
        return res.status(401).json({
          message:
            "No active password reset request found. Please request a new reset.",
        });
      }

      // Verify that the stored token matches the one from the URL
      if (user.resetPasswordToken !== verificationToken) {
        return res.status(401).json({
          message: "Invalid or expired reset link. Please request a new one.",
        });
      }

      return res.status(200).json({ token: verificationToken });
    } catch {
      return res
        .status(401)
        .json({ message: "Link is not valid or expired. Please try again." });
    }
  } catch (err) {
    return handleError(err, res);
  }
};
