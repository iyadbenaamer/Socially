import fs from "fs";
import { fork } from "child_process";
import { Types } from "mongoose";

import User from "../models/user.js";
import Profile from "../models/profile.js";
import Post from "../models/post.js";
import Comment from "../models/comment.js";
import Reply from "../models/reply.js";
import View from "../models/view.js";
import PostLike from "../models/postLike.js";
import CommentLike from "../models/commentLike.js";
import ReplyLike from "../models/replyLike.js";
import Notification from "../models/notification.js";

import { getOnlineUsers } from "../socket/onlineUsers.js";
import { get as getNotification } from "./notification.js";
import { getServerSocketInstance } from "../socket/socketServer.js";
import { handleError } from "../utils/errorHandler.js";

const { ObjectId } = Types;

export const create = async (req, res) => {
  try {
    const { id } = req.user;
    let { text, location } = req.body;
    const { filesInfo } = req;
    text = text.trim();
    if (!text && !filesInfo) {
      return res.status(400).json({ message: "Post cannot be empty." });
    }
    if (text.length > 40000) {
      return res.status(400).json({ message: "Post text is too long." });
    }

    const profile = await Profile.findById(id);
    const post = await Post.create({
      creatorId: id,
      text: text?.trim(),
      files: filesInfo,
      createdAt: Date.now(),
      location: location?.trim(),
    });

    /*
    Run the classification and analysis of the post's text
    in a separate process
    */
    const child = fork("./workers/classifyText.js");
    child.send({ postId: post._id, text });

    return res.status(201).json({
      ...post.toObject(),
      profile,
      commentsCount: 0,
      likesCount: 0,
      views: 0,
      isLiked: false,
      isSaved: false,
      isViewed: true,
    });
  } catch (err) {
    return handleError(err, res);
  }
};

export const share = async (req, res) => {
  const uploadsFolder = `${process.env.API_URL}/storage/`;
  try {
    const { user } = req;
    let { postId } = req.query;
    let { text, location } = req.body;
    text = text.trim();
    const { media } = req.files;

    const profile = await Profile.findById(user.id);
    const sharedPost = await Post.findById(postId);

    if (!sharedPost) {
      return res.status(404).json({ message: "Post not found." });
    }

    const sharedPostProfile = await Profile.findById(sharedPost.creatorId);

    let filesInfo = [];
    if (media) {
      media.map((file) => {
        if (file.mimetype.startsWith("image")) {
          filesInfo.push({
            path: `${uploadsFolder}${file.filename}`,
            fileType: "photo",
          });
        } else if (file.mimetype.startsWith("video")) {
          filesInfo.push({
            path: `${uploadsFolder}${file.filename}`,
            fileType: "video",
          });
        }
      });
    }

    if (!text && filesInfo.length === 0) {
      return res.status(400).json({ message: "Post cannot be empty." });
    }
    if (text.length > 40000) {
      return res.status(400).json({ message: "Post text is too long." });
    }
    /*
    if who shared the post is NOT the same as the post creator 
    then a notification will be created.
    */
    if (user.id !== sharedPost.creatorId.toString()) {
      let notification = await Notification.create({
        type: "share",
        userId: sharedPost.creatorId,
        engagedUserId: user._id,
        createdAt: Date.now(),
        isRead: false,
      });
      const postCreator = await User.findById(sharedPost.creatorId);
      if (postCreator) {
        postCreator.unreadNotificationsCount += 1;
        await postCreator.save();

        const post = await Post.create({
          creatorId: user.id,
          text,
          createdAt: Date.now(),
          location: location.trim(),
          sharedPost: {
            _id: sharedPost._id,
            creatorId: sharedPost.creatorId,
            notificationId: notification.id,
          },
        });
        await post.save();
        notification.path = `/post?_id=${post.id}`;
        await notification.save();
        await postCreator.save();
        notification = await getNotification(notification.id);
        // sending the notification by web socket
        const socketIdsList = getOnlineUsers().get(
          sharedPost.creatorId.toString(),
        );
        if (socketIdsList) {
          socketIdsList.map((socketId) => {
            getServerSocketInstance()
              .to(socketId)
              .emit("push-notification", notification);
          });
        }
        return res.status(201).json({
          ...post.toObject(),
          sharedPost: {
            ...sharedPost.toObject(),
            profile: sharedPostProfile.toObject(),
          },
          profile,
          commentsCount: 0,
          likesCount: 0,
          views: 1,
          isSaved: false,
          isLiked: false,
          isViewed: true,
        });
      }
    }
    const post = await Post.create({
      creatorId: user.id,
      text,
      createdAt: Date.now(),
      location: location.trim(),
      sharedPost: {
        _id: sharedPost._id,
        creatorId: sharedPost.creatorId,
      },
    });

    await View.create({
      userId: user.id,
      postId: post.id,
      createdAt: Date.now(),
    });

    // adding the post's category to the user's favorite topics
    const updateObj = {};
    sharedPost.keywords.forEach((keyword) => {
      updateObj[`favoriteTopics.${keyword}.count`] = 1;
    });

    await user.updateOne({ $inc: updateObj }, { new: true });

    return res.status(201).json({
      ...post.toObject(),
      sharedPost: {
        ...sharedPost.toObject(),
        profile: sharedPostProfile.toObject(),
      },
      profile,
      commentsCount: 0,
      likesCount: 0,
      views: 1,
      isSaved: false,
      isLiked: false,
      isViewed: true,
    });
  } catch (err) {
    return handleError(err, res);
  }
};

export const get = async (req, res) => {
  try {
    const userId = req.user?._id;
    const postId = req.query?.postId;
    if (!postId) {
      return res.status(400).json({ message: "Post ID is required" });
    }
    const post = await Post.aggregate([
      {
        $match: {
          _id: new ObjectId(postId),
        },
      },
      {
        $lookup: {
          from: "posts",
          let: {
            sharedPostId: "$sharedPost._id",
            currentUserId: userId,
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
            // follow state for shared post creator
            {
              $lookup: {
                from: "follows",
                let: {
                  targetId: "$creatorId",
                  currentUserId: userId,
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$followedId", "$$targetId"] },
                          { $eq: ["$followerId", "$$currentUserId"] },
                        ],
                      },
                    },
                  },
                  { $limit: 1 },
                ],
                as: "sharedFollowArr",
              },
            },
            {
              $addFields: {
                profile: {
                  $mergeObjects: [
                    { $ifNull: ["$profile", {}] },
                    {
                      isFollowing: { $gt: [{ $size: "$sharedFollowArr" }, 0] },
                    },
                  ],
                },
              },
            },
            {
              $project: {
                profileArr: 0,
                sharedFollowArr: 0,
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
      {
        $addFields: {
          isSharedNull: { $eq: ["$sharedPost", null] },
        },
      },
      {
        $lookup: {
          from: "postlikes",
          let: { postId: "$_id", userId: userId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$postId", "$$postId"] },
                    { $eq: ["$userId", "$$userId"] },
                  ],
                },
              },
            },
          ],
          as: "userLikeArr",
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
        $lookup: {
          from: "views",
          let: { postId: "$_id", userId: userId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$postId", "$$postId"] },
                    { $eq: ["$userId", "$$userId"] },
                  ],
                },
              },
            },
          ],
          as: "userViewsArr",
        },
      },
      // saved state for current user
      {
        $lookup: {
          from: "savedposts",
          let: { postId: "$_id", userId: userId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$postId", "$$postId"] },
                    { $eq: ["$userId", "$$userId"] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "userSavedArr",
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
      // follow state for main post creator
      {
        $lookup: {
          from: "follows",
          let: {
            creatorId: "$creatorId",
            currentUserId: userId,
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$followedId", "$$creatorId"] },
                    { $eq: ["$followerId", "$$currentUserId"] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "followArr",
        },
      },
      {
        $addFields: {
          isLiked: { $gt: [{ $size: "$userLikeArr" }, 0] },
          // if user not authenticated (userId null) treat as viewed
          isViewed: userId ? { $gt: [{ $size: "$userViewsArr" }, 0] } : true,
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
          isSaved: { $gt: [{ $size: "$userSavedArr" }, 0] },
          sharedPost: {
            $cond: [
              { $gt: [{ $size: "$sharedPostArr" }, 0] },
              { $arrayElemAt: ["$sharedPostArr", 0] },
              null,
            ],
          },
          // embed isFollowing into profile
          profile: {
            $mergeObjects: [
              { $ifNull: ["$profile", {}] },
              { isFollowing: { $gt: [{ $size: "$followArr" }, 0] } },
              { $arrayElemAt: ["$profileArr", 0] },
            ],
          },
        },
      },
      {
        $project: {
          commentsCountArr: 0,
          likesCountArr: 0,
          userLikeArr: 0,
          userViewsArr: 0,
          viewsCountArr: 0,
          sharedPostArr: 0,
          keywords: 0,
          profileArr: 0,
          followArr: 0,
          isFollowing: 0,
          userSavedArr: 0,
        },
      },
    ]);
    return res.status(200).json(post[0]);
  } catch (error) {
    return handleError(err, res);
  }
};

export const getLikes = async (req, res) => {
  try {
    const { id, cursor } = req.query;
    const cursorDate = cursor ? parseInt(cursor) : 0;
    const userId = req.user?._id || req.user?.id; // may be undefined for unauthenticated

    const likes = await PostLike.aggregate([
      { $match: { postId: new ObjectId(id), createdAt: { $gt: cursorDate } } },
      { $sort: { createdAt: 1 } },
      { $limit: 30 },
      {
        $lookup: {
          from: "profiles",
          localField: "userId",
          foreignField: "_id",
          as: "profile",
          pipeline: [
            {
              $project: {
                firstName: 1,
                lastName: 1,
                username: 1,
                profilePicPath: 1,
                profileCoverPath: 1,
                bio: 1,
                followersCount: 1,
                followingCount: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          profile: { $arrayElemAt: ["$profile", 0] },
        },
      },
      // Attach isFollowing only if we have an authenticated user
      ...(userId
        ? [
            {
              $lookup: {
                from: "follows",
                let: { targetUserId: "$profile._id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$followedId", "$$targetUserId"] },
                          { $eq: ["$followerId", new ObjectId(userId)] },
                        ],
                      },
                    },
                  },
                  { $limit: 1 },
                ],
                as: "followArr",
              },
            },
            {
              $addFields: {
                isFollowing: { $gt: [{ $size: "$followArr" }, 0] },
              },
            },
            { $project: { followArr: 0 } },
          ]
        : []),
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              { createdAt: "$createdAt" },
              "$profile",
              userId ? { isFollowing: "$isFollowing" } : {},
            ],
          },
        },
      },
    ]);
    return res.status(200).json(likes);
  } catch (err) {
    return handleError(err, res);
  }
};

export const edit = async (req, res) => {
  try {
    const { user, post } = req;
    const { text, location } = req.body;
    if (post.creatorId.toString() !== user.id) {
      return res.status(401).send("Unauthorized");
    }

    text ? (post.text = text) : null;
    location ? (post.location = location) : null;
    await post.save();
    return res.status(200).json(post);
  } catch (err) {
    return handleError(err, res);
  }
};

export const setViewed = async (req, res) => {
  try {
    const { user, post } = req;
    if (post.creatorId.toString() === user.id) {
      return res.status(409).send("cannot view own post");
    }
    const isViewed = await View.findOne({ postId: post._id, userId: user._id });
    if (isViewed) {
      return res.status(409).send("already viewed");
    }
    await View.create({
      userId: user.id,
      postId: post.id,
      createdAt: Date.now(),
    });
    return res.send("success");
  } catch (err) {
    return handleError(err, res);
  }
};
// export const setViewed = async (req, res) => {
//   try {
//     const { user, post } = req;
//     if (post.creatorId.toString() === user.id) {
//       return res.status(409).send("cannot view own post");
//     }
//     // Atomic upsert to avoid race conditions creating duplicates
//     const result = await View.updateOne(
//       { postId: post._id, userId: user._id },
//       { $setOnInsert: { createdAt: Date.now() } },
//       { upsert: true }
//     );

//     // If upserted, this was the first view; otherwise it already existed
//     if (result.upsertedCount === 1 || result.upsertedId) {
//       return res.send("success");
//     }
//     return res.status(409).send("already viewed");
//   } catch (err) {
//     // Handle unique index race gracefully
//     if (err?.code === 11000) {
//       return res.status(409).send("already viewed");
//     }
//     return handleError(err, res);
//   }
// };

export const toggleComments = async (req, res) => {
  try {
    const { post } = req;
    post.isCommentsDisabled = !post.isCommentsDisabled;
    await post.save();
    const message = post.isCommentsDisabled
      ? "Comments are disabled."
      : "Comments are enabled.";
    return res.status(200).json({ message });
  } catch (err) {
    return handleError(err, res);
  }
};
export const likeToggle = async (req, res) => {
  try {
    const { user, post } = req;
    const postCreator = await User.findById(post.creatorId);
    const like = await PostLike.findOne({ userId: user.id, postId: post.id });
    /*
    if the user liked the post then create 
    a like doc for the user and the post
    */
    if (like) {
      /*
      if who unliked the post is the same as the post creator 
      then no notification will be removed.
      */
      if (user.id !== post.creatorId.toString()) {
        // romving the like's notification
        const notification = await Notification.findById(like.notificationId);
        if (notification) {
          const socketIdsList = getOnlineUsers().get(post.creatorId.toString());
          if (socketIdsList) {
            socketIdsList.map((socketId) => {
              getServerSocketInstance()
                .to(socketId)
                .emit("remove-notification", notification.id);
            });
          }

          if (!notification.isRead) {
            postCreator.unreadNotificationsCount--;
          }
          await notification.deleteOne();
          await postCreator.save();
        }
      }
      await like.deleteOne();
      return res.status(200).json({ isLiked: false });
    }
    /*
    if who liked the post is the same as the post creator 
    then no notification will be created.
    */
    if (user.id !== post.creatorId.toString()) {
      let notification = await Notification.create({
        userId: post.creatorId,
        engagedUserId: user._id,
        type: "postLike",
        path: `/post?_id=${post.id}`,
        createdAt: Date.now(),
        isRead: false,
      });
      if (postCreator) {
        postCreator.unreadNotificationsCount += 1;
        await postCreator.save();

        await PostLike.create({
          postId: post.id,
          userId: user.id,
          notificationId: notification.id,
          createdAt: Date.now(),
        });
        notification = await getNotification(notification.id);

        const socketIdsList = getOnlineUsers().get(post.creatorId.toString());
        if (socketIdsList) {
          socketIdsList.map((socketId) => {
            getServerSocketInstance()
              .to(socketId)
              .emit("push-notification", notification);
          });
        }
      }

      // adding the post's category to the user's favorite topics
      const updateObj = {};
      post.keywords?.forEach((keyword) => {
        updateObj[`favoriteTopics.${keyword}.count`] = 1;
      });

      await user.updateOne({ $inc: updateObj }, { new: true });
      return res.status(200).json({ isLiked: true });
    }
    await PostLike.create({
      postId: post.id,
      userId: user.id,
      createdAt: Date.now(),
    });
    return res.status(200).json({ isLiked: true });
  } catch (err) {
    return handleError(err, res);
  }
};

export const deletePost = async (req, res) => {
  try {
    const { admin, user, post } = req;

    if (!admin) {
      if (post.creatorId?.toString() !== user?.id) {
        return res.status(401).send("Unauthorized");
      }
    }

    // delete the attached files from the storage
    post.files?.map((file) => {
      const filename = `./public/storage/${file.path.split("/").at(-1)}`;
      try {
        fs.unlinkSync(filename);
      } catch (e) {
        console.log(e);
      }
    });

    // if the post is a shared post then the share notification should be deleted
    if (post.sharedPost) {
      /*
    if who shared the post is the same as the post creator 
    then no notification will be removed.
    */
      if (user?.id !== post.sharedPost.creatorId.toString()) {
        const sharedPostCreator = await User.findById(
          post.sharedPost.creatorId,
        );
        // romving the like's notification
        const notification = await Notification.findById(
          post.sharedPost.notificationId,
        );
        if (notification) {
          const socketIdsList = getOnlineUsers().get(sharedPostCreator.id);
          if (socketIdsList) {
            socketIdsList.map((socketId) => {
              getServerSocketInstance()
                .to(socketId)
                .emit("remove-notification", notification.id);
            });
          }

          if (!notification.isRead) {
            sharedPostCreator.unreadNotificationsCount--;
          }
          await notification.deleteOne();
          await sharedPostCreator.save();
        }
      }
    }
    // delete all related docs to the post
    await PostLike.deleteMany({ postId: post.id });
    await View.deleteMany({ postId: post.id });
    await Reply.deleteMany({ postId: post.id });
    await ReplyLike.deleteMany({ postId: post.id });
    await Comment.deleteMany({ postId: post.id });
    await CommentLike.deleteMany({ postId: post.id });

    await post.deleteOne();
    return res.status(200).json({ message: "post deleted successfully" });
  } catch (err) {
    return handleError(err, res);
  }
};
