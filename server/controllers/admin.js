import jwt from "jsonwebtoken";

import Admin from "../models/admin.js";
import { handleError } from "../utils/errorHandler.js";
import Post from "../models/post.js";

// POST /api/admin/login
export const login = async (req, res) => {
  try {
    let { username, password } = req.body;
    if (!(username && password)) {
      return res
        .status(400)
        .json({ message: "Username and password required." });
    }
    username = username.trim();
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }
    const isMatch = password === admin.password;
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }
    const token = jwt.sign(
      { adminId: admin.id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.TOKEN_EXPIRATION }
    );
    res.cookie("admin_token", token, { maxAge: 500000, signed: true });
    return res
      .status(200)
      .json({ token, admin: { id: admin.id, username: admin.username } });
  } catch (err) {
    return handleError(err, res);
  }
};

export const getPostsPaginated = async (req, res) => {
  try {
    let { cursor: cursorDate } = req.query;
    cursorDate = parseInt(cursorDate);
    cursorDate = cursorDate ? cursorDate : Date.now();
    let posts = await Post.aggregate([
      {
        $lookup: {
          from: "posts",
          let: {
            sharedPostId: "$sharedPost._id",
          },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$sharedPostId"] } } },
            {
              $lookup: {
                from: "profiles",
                let: { creatorId: "$creatorId" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$_id", "$$creatorId"] },
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      firstName: 1,
                      lastName: 1,
                      username: 1,
                      profilePicPath: 1,
                      followersCount: 1,
                      followingCount: 1,
                      bio: 1,
                      location: 1,
                      gender: 1,
                      lastSeenAt: 1,
                    },
                  },
                ],
                as: "profileArr",
              },
            },
            {
              $addFields: {
                profile: { $arrayElemAt: ["$profileArr", 0] },
              },
            },
            {
              $addFields: {
                profile: {
                  $mergeObjects: [{ $ifNull: ["$profile", {}] }],
                },
              },
            },
            {
              $project: {
                profileArr: 0,
              },
            },
          ],
          as: "sharedPostArr",
        },
      },
      {
        $lookup: {
          from: "views",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$postId", "$$postId"] },
              },
            },
            { $count: "count" },
          ],
          as: "viewsCountArr",
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          isSharedNull: { $eq: ["$sharedPost", null] },
        },
      },
      {
        $lookup: {
          from: "postlikes",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$postId", "$$postId"] },
              },
            },
            { $count: "count" },
          ],
          as: "likesCountArr",
        },
      },
      {
        $lookup: {
          from: "comments",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$postId", "$$postId"] },
              },
            },
            { $count: "count" },
          ],
          as: "commentsCountArr",
        },
      },
      {
        $match: {
          createdAt: { $lt: cursorDate },
        },
      },
      {
        $lookup: {
          from: "profiles",
          let: { creatorId: "$creatorId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$creatorId"] },
              },
            },
            {
              $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                username: 1,
                profilePicPath: 1,
                followersCount: 1,
                followingCount: 1,
                bio: 1,
                location: 1,
                gender: 1,
                lastSeenAt: 1,
              },
            },
          ],
          as: "profileArr",
        },
      },
      {
        $addFields: {
          likesCount: {
            $cond: [
              { $gt: [{ $size: "$likesCountArr" }, 0] },
              { $arrayElemAt: ["$likesCountArr.count", 0] },
              0,
            ],
          },
          commentsCount: {
            $cond: [
              { $gt: [{ $size: "$commentsCountArr" }, 0] },
              { $arrayElemAt: ["$commentsCountArr.count", 0] },
              0,
            ],
          },
          views: {
            $cond: [
              { $gt: [{ $size: "$viewsCountArr" }, 0] },
              { $arrayElemAt: ["$viewsCountArr.count", 0] },
              0,
            ],
          },
          sharedPost: {
            $cond: [
              { $gt: [{ $size: "$sharedPostArr" }, 0] },
              { $arrayElemAt: ["$sharedPostArr", 0] },
              null,
            ],
          },
          profile: {
            $mergeObjects: [
              { $ifNull: ["$profile", {}] },
              { $arrayElemAt: ["$profileArr", 0] },
            ],
          },
        },
      },
      {
        $project: {
          commentsCountArr: 0,
          likesCountArr: 0,
          viewsCountArr: 0,
          sharedPostArr: 0,
          keywords: 0,
          profileArr: 0,
        },
      },
    ]);
    return res.status(200).json(posts);
  } catch (err) {
    return handleError(err, res);
  }
};
