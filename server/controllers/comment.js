import { Types } from "mongoose";

import Profile from "../models/profile.js";
import User from "../models/user.js";
import Comment from "../models/comment.js";
import Reply from "../models/reply.js";
import CommentLike from "../models/commentLike.js";
import ReplyLike from "../models/replyLike.js";

import { handleError } from "../utils/errorHandler.js";
import { getOnlineUsers } from "../socket/onlineUsers.js";
import { getServerSocketInstance } from "../socket/socketServer.js";
import Notification from "../models/notification.js";
import { get as getNotification } from "./notification.js";

const { ObjectId } = Types;

export const getOne = async (req, res) => {
  try {
    const { comment } = req;
    const profile = await Profile.findById(comment.creatorId);
    const isLiked = await CommentLike.findOne({ commentId: comment.id });
    const likesCount = await CommentLike.countDocuments({
      commentId: comment.id,
    });
    const repliesCount = await Reply.countDocuments({ commentId: comment.id });
    const responseComment = {
      ...comment.toObject(),
      profile,
      likesCount,
      repliesCount,
      isLiked: Boolean(isLiked),
    };
    return res.status(200).json(responseComment);
  } catch (err) {
    return handleError(err, res);
  }
};

export const getPage = async (req, res) => {
  try {
    const { user, post } = req;
    const { cursor } = req.query;
    const cursorDate = cursor ? parseInt(cursor) : Date.now();

    const comments = await Comment.aggregate([
      {
        $match: {
          postId: post._id,
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
                profileCoverPath: 1,
                bio: 1,
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
          from: "commentlikes",
          let: { commentId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$commentId", "$$commentId"] },
              },
            },
          ],
          as: "likesArr",
        },
      },
      {
        $lookup: {
          from: "replies",
          localField: "_id",
          foreignField: "commentId",
          as: "repliesArr",
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
          repliesCount: { $size: "$repliesArr" },
        },
      },
      {
        $project: {
          profileArr: 0,
          likesArr: 0,
          repliesArr: 0,
        },
      },
    ]);

    return res.status(200).json(comments);
  } catch (err) {
    return handleError(err, res);
  }
};

export const getLikes = async (req, res) => {
  try {
    const { id, cursor } = req.query;
    const cursorDate = cursor ? parseInt(cursor) : 0;
    const userId = req.user?._id || req.user?.id; // may be undefined for unauthenticated

    const likes = await CommentLike.aggregate([
      {
        $match: { commentId: new ObjectId(id), createdAt: { $gt: cursorDate } },
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
    const { user, post } = req;
    let { text } = req.body;
    text = text.trim();
    const { fileInfo } = req;
    const profile = await Profile.findById(user.id).select(
      "_id firstName lastName username profilePicPath bio location gender lastSeenAt"
    );
    // if the comment disabled then only the post author can comment
    if (post.isCommentsDisabled && user.id !== post.creatorId.toString()) {
      return res.status(409).json({ message: "Comments are disabled." });
    }
    if (text.length > 10000) {
      return res.status(400).json({ message: "Comment text is too long." });
    }
    if (!(text || fileInfo)) {
      return res.status(400).json({ message: "Comment cannot be empty." });
    }
    /*
    if who commented is NOT the same as the post creator 
    then a notification will be created.
    */
    if (user.id !== post.creatorId.toString()) {
      let notification = await Notification.create({
        type: "comment",
        userId: post.creatorId,
        engagedUserId: user._id,
        createdAt: Date.now(),
        isRead: false,
      });
      const postCreator = await User.findById(post.creatorId);
      if (!postCreator) {
        return handleError(err, res);
      }
      postCreator.unreadNotificationsCount += 1;
      await postCreator.save();

      const comment = await Comment.create({
        postId: post.id,
        creatorId: user.id,
        text: text.trim(),
        notificationId: notification?.id,
        file: fileInfo ? fileInfo : null,
        createdAt: Date.now(),
      });
      notification.path = `/post?_id=${post.id}&commentId=${comment.id}`;
      await notification.save();
      notification = await getNotification(notification.id);
      await postCreator.save();
      // sending the notification by web socket
      const socketIdsList = getOnlineUsers().get(post.creatorId.toString());
      if (socketIdsList) {
        socketIdsList.map((socketId) => {
          getServerSocketInstance()
            .to(socketId)
            .emit("push-notification", notification);
        });
      }

      // adding the post's category to the user's favorite topics
      const updateObj = {};
      post.keywords?.forEach((keyword) => {
        updateObj[`favoriteTopics.${keyword}.count`] = 1;
      });
      await user.updateOne({ $inc: updateObj }, { new: true });

      return res.status(200).json({
        ...comment.toObject(),
        repliesCount: 0,
        likesCount: 0,
        isLiked: false,
        profile,
      });
    }
    /*
    if who commented is the same as the post creator 
    then no notification will be created.
    */
    const comment = await Comment.create({
      creatorId: user.id,
      postId: post.id,
      text: text.trim(),
      file: fileInfo ? fileInfo : null,
      createdAt: Date.now(),
    });
    return res.status(200).json({
      ...comment.toObject(),
      likesCount: 0,
      repliesCount: 0,
      isLiked: false,
      profile,
    });
  } catch (err) {
    return handleError(err, res);
  }
};

/*UPDATE*/

export const edit = async (req, res) => {
  try {
    let { text } = req.body;
    text = text.trim();
    const { user, comment } = req;

    if (comment.creatorId?.toString() !== user.id) {
      return res.status(401).send("Unauthorized");
    }

    if (text.length > 10000) {
      return res.status(400).json({ message: "Comment text is too long." });
    }

    if (!text) {
      return res.status(400).json({ message: "Comment cannot be empty." });
    }

    comment.text = text;
    await comment.save();
    return res.status(200).json(comment);
  } catch (err) {
    return handleError(err, res);
  }
};

export const likeToggle = async (req, res) => {
  try {
    const { post, user, comment } = req;
    const { creatorId } = comment;
    const commentCreator = await User.findById(comment.creatorId);

    /*
    if the comment's likes includes the user id, then
    it means that the user liked the comment, therefore 
    the user id will be removed from the comment's likes  
    */
    const like = await CommentLike.findOne({
      userId: user.id,
      postId: post.id,
    });
    if (like) {
      /*
    if who unliked the comment is the same as the comment creator 
    then no notification will be removed.
    */
      if (user.id !== comment.creatorId.toString()) {
        // romving the like's notification
        const notification = await Notification.findById(like.notificationId);
        if (notification) {
          const socketIdsList = getOnlineUsers().get(creatorId.toString());
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
      }
      await like.deleteOne();
      return res.status(200).json({ isLiked: false });
    }

    /*
    if who liked the comment is the same as the comment creator 
    then no notification will be created.
    */
    if (user.id !== comment.creatorId.toString()) {
      let notification = await Notification.create({
        userId: comment.creatorId,
        engagedUserId: user._id,
        type: "commentLike",
        path: `/post?_id=${post.id}&commentId=${comment.id}`,
        createdAt: Date.now(),
        isRead: false,
      });
      if (commentCreator) {
        commentCreator.unreadNotificationsCount += 1;
        await commentCreator.save();

        const commentLike = await CommentLike.create({
          userId: user.id,
          commentId: comment.id,
          postId: post.id,
          notificationId: notification.id,
          createdAt: Date.now(),
        });
        await commentLike.save();
        notification = await getNotification(notification.id);
        const socketIdsList = getOnlineUsers().get(creatorId.toString());
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
    const commentLike = await CommentLike.create({
      userId: user.id,
      commentId: comment.id,
      postId: post.id,
      createdAt: Date.now(),
    });
    await commentLike.save();

    return res.status(200).json({ isLiked: true });
  } catch (err) {
    return handleError(err, res);
  }
};

/*DELETE*/

export const deleteComment = async (req, res) => {
  try {
    const { admin, user, post, comment } = req;
    /*
    the comment can be deleted ether by the comment
    creator or the post creator or by admins
    */
    if (!admin) {
      if (
        !(
          user?.id === comment.creatorId?.toString() ||
          user?.id === post.creatorId?.toString()
        )
      ) {
        return res.status(401).send("Unauthorized");
      }
    }

    const postCreator = await User.findById(post.creatorId);
    const notification = await Notification.findById(comment.notificationId);
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
    // delete all related docs to the post
    await Reply.deleteMany({ postId: post.id });
    await ReplyLike.deleteMany({ postId: post.id });
    await CommentLike.deleteMany({ postId: post.id });
    // finally delete the comment
    await comment.deleteOne();
    return res.status(200).json({ message: "Comment is deleted." });
  } catch (err) {
    return handleError(err, res);
  }
};
