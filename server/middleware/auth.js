import jwt from "jsonwebtoken";

import Admin from "../models/admin.js";
import User from "../models/user.js";

import { handleError } from "../utils/errorHandler.js";

export const verifyToken = async (req, res, next) => {
  let token = req.header("Authorization");
  if (!token) {
    return res.status(403).json("login first");
  }
  if (token.startsWith("Bearer ")) {
    token = token.trimStart().slice(7);
  }
  try {
    const tokenInfo = jwt.verify(token, process.env.JWT_SECRET);
    // check if the token is an admin token
    if (tokenInfo.role === "admin") {
      const admin = await Admin.findById(tokenInfo.adminId);
      if (!admin) {
        return res.status(403).json("invalid token or admin doesn't exist");
      }
      req.admin = admin;
      return next();
    }
    const user = await User.findById(tokenInfo.id);
    if (user) {
      req.user = user;
      return next();
    } else {
      return res.status(403).json("invalid token or user doesn't exist");
    }
  } catch (err) {
    return handleError(err, res);
  }
};

export const getUserInfo = async (req, res, next) => {
  let token = req.header("Authorization");
  if (!token) {
    return next();
  }
  if (token.startsWith("Bearer ")) {
    token = token.trimStart().slice(7);
  }
  try {
    const tokenInfo = jwt.verify(token, process.env.JWT_SECRET);
    // check if the token is an admin token
    if (tokenInfo.role === "admin") {
      const admin = await Admin.findById(tokenInfo.adminId);
      if (!admin) {
        return res.status(403).json("invalid token or admin doesn't exist");
      }
      req.admin = admin;
      return next();
    }
    const user = await User.findById(tokenInfo.id);
    if (user) {
      req.user = user;
      next();
    } else {
      return res.status(403).json("invalid token or user doesn't exist");
    }
  } catch (err) {
    return handleError(err, res);
  }
};

export const verifySocketToken = async (socket, next) => {
  let token = socket.handshake.auth?.token;
  if (!token) {
    return next();
    // return res.status(403).json("login first");
  }
  if (token.startsWith("Bearer ")) {
    token = token.trimStart().slice(7);
  }
  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(userInfo.id);
    if (user) {
      socket.user = user;
      next();
    } else {
      // return res.status(403).json("invalid token or user doesn't exist");
    }
  } catch {
    // return res
    // .status(500)
    // .json({ message: "An error occurred. Please try again later." });
  }
};
