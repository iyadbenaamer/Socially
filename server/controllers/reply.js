import { Types } from "mongoose";

import User from "../models/user.js";
import Profile from "../models/profile.js";
import Reply from "../models/reply.js";
import ReplyLike from "../models/replyLike.js";
import Notification from "../models/notification.js";

import { get as getNotification } from "./notification.js";
import { getOnlineUsers } from "../socket/onlineUsers.js";
import { getServerSocketInstance } from "../socket/socketServer.js";
import { handleError } from "../utils/errorHandler.js";

const { ObjectId } = Types;

export const get = async (req, res) => {
  try {
    const { user, reply } = req;
    const profile = await Profile.findById(reply.creatorId);
    const isLiked = await ReplyLike.findOne({
      replyId: reply.id,
      userId: user?.id,
    });
    return res
      .status(200)
      .json({ ...reply.toObject(), profile, isLiked: Boolean(isLiked) });
  } catch (err) {
    return handleError(err, res);
  }
};

export const getPage = async (req, res) => {
  try {
    const { user, comment } = req;
    const { cursor } = req.query;
    const cursorDate = cursor ? parseInt(cursor) : 0;

    const replies = await Reply.aggregate([
      {
        $match: {
          commentId: comment._id,
          createdAt: { $gt: cursorDate },
        },
      },
      { $sort: { createdAt: 1 } },
      { $limit: 20 },
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
              },
            },
          ],
          as: "profileArr",
        },
      },
      {
        $lookup: {
          from: "replylikes",
          let: { replyId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$replyId", "$$replyId"] },
              },
            },
          ],
          as: "likesArr",
        },
      },
      {
        $addFields: {
          profile: { $arrayElemAt: ["$profileArr", 0] },
          isLiked: {
            $in: [
              user?._id?.toString(),
              {
                $map: {
                  input: "$likesArr",
                  as: "like",
                  in: { $toString: "$$like.userId" },
                },
              },
            ],
          },
          likesCount: { $size: "$likesArr" },
        },
      },
      {
        $project: {
          profileArr: 0,
          likesArr: 0,
        },
      },
    ]);

    return res.status(200).json(replies);
  } catch (err) {
    return handleError(err, res);
  }
};

export const getLikes = async (req, res) => {
  try {
    const { id, cursor } = req.query;
    const cursorDate = cursor ? parseInt(cursor) : 0;
    const userId = req.user?._id || req.user?.id; // may be undefined for unauthenticated

    const likes = await ReplyLike.aggregate([
      {
        $match: { replyId: new ObjectId(id), createdAt: { $gt: cursorDate } },
      },
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

export const add = async (req, res) => {
  try {
    const { user, post, comment } = req;
    const { fileInfo } = req;
    let { text } = req.body;
    text = text.trim();
    const profile = await Profile.findById(user.id);

    // if the comment disabled then only the post author can reply to a comment
    if (post.isCommentsDisabled && user.id !== post.creatorId.toString()) {
      return res.status(409).json({ message: "Comments are disabled." });
    }
    if (text.length > 10000) {
      return res.status(400).json({ message: "Reply text is too long." });
    }
    if (!(text || fileInfo)) {
      return res.status(409).json({ message: "Reply cannot be empty." });
    }

    // adding the post's category to the user's favorite topics
    const updateObj = {};
    post.keywords?.forEach((keyword) => {
      updateObj[`favoriteTopics.${keyword}.count`] = 1;
    });

    await user.updateOne({ $inc: updateObj }, { new: true });
    /*
    if who replied is NOT the same as the comment creator 
    then a notification will be created.
    */
    if (user.id !== comment.creatorId.toString()) {
      let notification = await Notification.create({
        userId: comment.creatorId,
        engagedUserId: user._id,
        type: "reply",
        createdAt: Date.now(),
        isRead: false,
      });
      const commentCreator = await User.findById(comment.creatorId);
      if (!commentCreator) {
        return handleError(err, res);
      }
      commentCreator.unreadNotificationsCount += 1;
      await commentCreator.save();

      const reply = await Reply.create({
        creatorId: user.id,
        postId: post.id,
        commentId: comment.id,
        text: text.trim(),
        notificationId: notification?.id,
        file: fileInfo ? fileInfo : null,
        createdAt: Date.now(),
      });
      notification.path = `/post?_id=${post.id}&commentId=${comment.id}&replyId=${reply.id}`;
      await notification.save();
      await commentCreator.save();

      notification = await getNotification(notification.id);
      // sending the notification by web socket
      const socketIdsList = getOnlineUsers().get(comment.creatorId.toString());
      if (socketIdsList) {
        socketIdsList.map((socketId) => {
          getServerSocketInstance()
            .to(socketId)
            .emit("push-notification", notification);
        });
      }
      return res.status(200).json({
        ...reply.toObject(),
        profile,
        isLiked: false,
        likesCount: 0,
      });
    }
    /*
    if who commented is the same as the post creator 
    then no notification will be created.
    */
    const reply = await Reply.create({
      creatorId: user.id,
      postId: post.id,
      commentId: comment.id,
      text: text.trim(),
      file: fileInfo ? fileInfo : null,
      createdAt: Date.now(),
    });
    return res
      .status(200)
      .json({ ...reply.toObject(), profile, isLiked: false, likesCount: 0 });
  } catch (err) {
    return handleError(err, res);
  }
};

export const edit = async (req, res) => {
  try {
    const { user, reply } = req;
    let { text } = req.body;
    text = text.trim();
    if (user.id !== reply.creatorId.toString()) {
      return res.status(401).json("Unauthorized");
    }

    if (text.length > 10000) {
      return res.status(400).json({ message: "Reply text is too long." });
    }

    if (!text) {
      return res.status(409).json({ message: "reply cannot be empty" });
    }

    reply.text = text;
    await reply.save();
    return res.status(200).json(reply);
  } catch (err) {
    return handleError(err, res);
  }
};

export const likeToggle = async (req, res) => {
  try {
    const { post, comment, reply, user } = req;
    const profile = await Profile.findById(user.id);
    const replyCreator = await User.findById(reply.creatorId);

    /*
    if the reply's likes includes the user id, then
    it means that the user liked the reply, therefore 
    the user id will be removed from the reply's likes  
    */
    const like = await ReplyLike.findOne({
      replyId: reply.id,
      userId: user.id,
    });
    if (like) {
      /*
    if who unliked the reply is the same as the reply creator 
    then no notification will be removed.
    */
      if (user.id !== reply.creatorId.toString()) {
        // romving the like's notification
        const notification = await Notification.findById(like.notificationId);
        if (notification) {
          const socketIdsList = getOnlineUsers().get(
            reply.creatorId.toString()
          );
          if (socketIdsList) {
            socketIdsList.map((socketId) => {
              getServerSocketInstance()
                .to(socketId)
                .emit("remove-notification", notification.id);
            });
          }

          if (!notification.isRead) {
            replyCreator.unreadNotificationsCount--;
          }
          await notification.deleteOne();
          await replyCreator.save();
        }
      }
      await like.deleteOne();
      return res.status(200).json({ isLiked: false });
    }
    /*
    if who liked the reply is the same as the reply creator 
    then no notification will be created.
    */
    if (user.id !== reply.creatorId.toString()) {
      let notification = await Notification.create({
        userId: reply.creatorId,
        engagedUserId: profile._id,
        type: "replyLike",
        path: `/post?_id=${post.id}&commentId=${comment.id}&replyId=${reply.id}`,
        createdAt: Date.now(),
        isRead: false,
      });
      if (replyCreator) {
        replyCreator.unreadNotificationsCount += 1;
        await replyCreator.save();

        const replyLike = await ReplyLike.create({
          postId: post.id,
          userId: user.id,
          replyId: reply.id,
          notificationId: notification.id,
          createdAt: Date.now(),
        });
        await replyLike.save();

        notification = await getNotification(notification.id);
        const socketIdsList = getOnlineUsers().get(reply.creatorId.toString());
        if (socketIdsList) {
          socketIdsList.map((socketId) => {
            getServerSocketInstance()
              .to(socketId)
              .emit("push-notification", notification);
          });
        }
      }
      return res.status(200).json({ isLiked: true });
    }
    await ReplyLike.create({
      postId: post.id,
      userId: user.id,
      replyId: reply.id,
      createdAt: Date.now(),
    });
    return res.status(200).json({ isLiked: true });
  } catch (err) {
    return handleError(err, res);
  }
};

export const deleteReply = async (req, res) => {
  try {
    const { admin, user, comment, reply } = req;
    /*
    the reply can be deleted ether by the reply
    creator or the post creator
    */
    if (!admin) {
      if (!(user?.id === reply.creatorId.toString())) {
        return res.status(401).json("Unauthorized");
      }
    }

    const commentCreator = await User.findById(comment.creatorId);
    const notification = await Notification.findById(reply.notificationId);
    if (notification) {
      const socketIdsList = getOnlineUsers().get(comment.creatorId.toString());
      if (socketIdsList) {
        socketIdsList.map((socketId) => {
          getServerSocketInstance()
            .to(socketId)
            .emit("remove-notification", notification.id);
        });
      }

      if (!notification.isRead) {
        commentCreator.unreadNotificationsCount--;
      }
      await notification.deleteOne();
      await commentCreator.save();
    }
    await ReplyLike.deleteMany({ replyId: reply.id });

    await reply.deleteOne();
    return res.status(200).json({ message: "Reply deleted." });
  } catch (err) {
    return handleError(err, res);
  }
};
