import { Types } from "mongoose";
import Follow from "../models/follow.js";
import Profile from "../models/profile.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";

import { get as getNotification } from "./notification.js";
import { getOnlineUsers } from "../socket/onlineUsers.js";
import { getServerSocketInstance } from "../socket/socketServer.js";
import { handleError } from "../utils/errorHandler.js";

const { ObjectId } = Types;

export const getProfile = async (req, res) => {
  try {
    const { user } = req;
    const { id, username } = req.query;
    /*
    a profile can be retrieved ether with a username or an ID
    just one method should be used, if ID and username both exist or they both
    not exist then return bad request.
    */
    if ((!id && !username) || (id && username)) {
      return res.status(400).send("bad request");
    }
    if (id && !username) {
      const profile = await Profile.findById(id);
      if (!profile) {
        return res.status(404).json({ message: "user not found" });
      }
      return res.status(200).json(profile);
    }
    if (username && !id) {
      const profile = await Profile.findOne({ username });
      if (!profile) {
        return res.status(404).json({ message: "user not found" });
      }
      const isFollowing = await Follow.findOne({
        followedId: profile._id,
        followerId: user?.id,
      });
      return res
        .status(200)
        .json({ ...profile.toObject(), isFollowing: Boolean(isFollowing) });
    }
  } catch (err) {
    return handleError(err, res);
  }
};

export const getFollowers = async (req, res) => {
  try {
    const { user } = req;
    const { id, cursor } = req.query;
    const followers = await Follow.aggregate([
      {
        $match: {
          followedId: new ObjectId(id),
          _id: {
            $gt: new ObjectId(cursor || "000000000000000000000000"),
          },
        },
      },
      { $limit: 20 },
      {
        $lookup: {
          from: "profiles",
          localField: "followerId",
          foreignField: "_id",
          as: "follower",
        },
      },
      { $unwind: "$follower" },
      {
        $lookup: {
          from: "follows",
          let: { followerId: "$follower._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$followerId", new ObjectId(user?.id)] },
                    { $eq: ["$followedId", "$$followerId"] },
                  ],
                },
              },
            },
          ],
          as: "isFollowingBack",
        },
      },
      {
        $addFields: {
          isFollowing: { $gt: [{ $size: "$isFollowingBack" }, 0] },
        },
      },
      {
        $project: {
          _id: "$follower._id",
          followId: "$_id",
          username: "$follower.username",
          firstName: "$follower.firstName",
          lastName: "$follower.lastName",
          profilePicPath: "$follower.profilePicPath",
          coverPicPath: "$follower.coverPicPath",
          followingCount: "$follower.followingCount",
          followersCount: "$follower.followersCount",
          bio: "$follower.bio",
          gender: "$follower.gender",
          isFollowing: 1,
        },
      },
    ]);
    const profile = await Profile.findById(id);
    return res.status(200).json({ followers, count: profile.followersCount });
  } catch (err) {
    return handleError(err, res);
  }
};

export const getFollowing = async (req, res) => {
  try {
    const { user } = req;
    const { id, cursor } = req.query;
    const following = await Follow.aggregate([
      {
        $match: {
          followerId: new ObjectId(id),
          _id: {
            $gt: new ObjectId(cursor || "000000000000000000000000"),
          },
        },
      },
      { $limit: 20 },
      {
        $lookup: {
          from: "profiles",
          localField: "followedId",
          foreignField: "_id",
          as: "followed",
        },
      },
      { $unwind: "$followed" },
      {
        $lookup: {
          from: "follows",
          let: { followedId: "$followed._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$followedId", "$$followedId"] },
                    { $eq: ["$followerId", new ObjectId(user.id)] },
                  ],
                },
              },
            },
          ],
          as: "isFollowingArr",
        },
      },
      {
        $addFields: {
          isFollowing: { $gt: [{ $size: "$isFollowingArr" }, 0] },
        },
      },
      {
        $project: {
          _id: "$followed._id",
          followId: "$_id",
          username: "$followed.username",
          firstName: "$followed.firstName",
          lastName: "$followed.lastName",
          followingCount: "$followed.followingCount",
          followersCount: "$followed.followersCount",
          profilePicPath: "$followed.profilePicPath",
          coverPicPath: "$followed.coverPicPath",
          bio: "$followed.bio",
          gender: "$followed.gender",
          isFollowing: 1,
        },
      },
    ]);
    const profile = await Profile.findById(id);

    return res.status(200).json({ following, count: profile.followingCount });
  } catch (err) {
    return handleError(err, res);
  }
};

export const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.body;
    const profile = await Profile.findOne({ username });
    if (profile) {
      return res.status(409).json({ message: "This username is taken." });
    }
    return res.status(200).json({ message: "username is available." });
  } catch (err) {
    return handleError(err, res);
  }
};

/*UPDATE*/

export const setProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const coverPic = req.files?.coverPic ? req.files.coverPic[0] : null;
    const profilePic = req.files?.profilePic ? req.files.profilePic[0] : null;
    const { username, bio, location } = req.body;
    const profile = await Profile.findById(id);
    // setting user name is optional because is has a default value.
    if (username) {
      /*
      if the user chose to set it, then we need to check if it't taken or not, if so 
      the response will return an error that the username must be unique.
      */
      if (await Profile.findOne({ username })) {
        return res.status(409).json({ message: "This username is taken." });
      }
      profile.username = username;
    }
    if (profilePic) {
      profile.profilePicPath = `/storage/${profilePic.filename}`;
    }
    if (coverPic) {
      profile.coverPicPath = `/storage/${coverPic.filename}`;
    }
    if (bio) {
      profile.bio = bio;
    }

    if (location) {
      profile.location = location;
    }
    await profile.save();
    return res.status(200).json(profile);
  } catch (err) {
    return handleError(err, res);
  }
};

export const follow = async (req, res) => {
  try {
    const { user } = req;
    const myId = user.id;
    const { userId } = req.query;
    if (myId == userId) {
      return res.status(409).json({ message: "cannot follow yourself" });
    }
    const myProfile = await Profile.findById(myId);
    const profileToFollow = await Profile.findById(userId);
    if (!myProfile) {
      return res.status(400).send("bad request");
    }
    if (!profileToFollow) {
      return res.status(404).json({ message: "User not found." });
    }

    const follow = await Follow.findOne({
      followedId: userId,
      followerId: myId,
    });

    if (follow) {
      return res
        .status(409)
        .json({ message: "You are already following this user." });
    }
    // creating a following notification
    const userToFollow = await User.findById(userId);
    let notification = await Notification.create({
      userId,
      engagedUserId: user._id,
      type: "follow",
      path: `/profile/${myProfile.username}`,
      createdAt: Date.now(),
      isRead: false,
    });
    userToFollow.unreadNotificationsCount += 1;
    await userToFollow.save();

    await Follow.create({
      followerId: myId,
      followedId: userId,
      notificationId: notification.id,
    });

    notification = await getNotification(notification.id);
    // sending the following notification to the followed user
    const socketIdsList = getOnlineUsers().get(userId);
    if (socketIdsList) {
      socketIdsList.map((socketId) => {
        getServerSocketInstance()
          .to(socketId)
          .emit("push-notification", notification);
      });
    }

    myProfile.followingCount += 1;
    profileToFollow.followersCount += 1;
    await myProfile.save();
    await profileToFollow.save();

    return res.status(200).send("success");
  } catch (err) {
    return handleError(err, res);
  }
};

export const unfollow = async (req, res) => {
  try {
    const { id: myId } = req.user;
    const { userId } = req.query;
    if (myId == userId) {
      return res.status(409).json({ message: "cannot unfollow yourself" });
    }
    const myProfile = await Profile.findById(myId);
    const profileToUnfollow = await Profile.findById(userId);

    if (!myProfile) {
      return res.status(400).send("bad request");
    }

    if (!profileToUnfollow) {
      return res.status(404).json({ message: "User not found." });
    }

    const follow = await Follow.findOne({
      followedId: userId,
      followerId: myId,
    });

    if (!follow) {
      return res
        .status(409)
        .json({ message: "You are not following this user." });
    }

    // removing the notification from database and from the client
    const { notificationId } = follow;
    const userToUnfollow = await User.findById(userId);
    const notification = await Notification.findById(notificationId);
    if (notification) {
      const socketIdsList = getOnlineUsers().get(userId);
      if (socketIdsList) {
        socketIdsList.map((socketId) => {
          getServerSocketInstance()
            .to(socketId)
            .emit("remove-notification", notification.id);
        });
      }
      if (!notification.isRead) {
        userToUnfollow.unreadNotificationsCount--;
      }
      await notification.deleteOne();
      await userToUnfollow.save();
    }
    await follow.deleteOne();
    if (myProfile.followingCount > 0) {
      myProfile.followingCount -= 1;
      await myProfile.save();
    }
    if (profileToUnfollow.followersCount > 0) {
      profileToUnfollow.followersCount -= 1;
      await profileToUnfollow.save();
    }

    return res.status(200).send("success");
  } catch (err) {
    return handleError(err, res);
  }
};

export const removeFollower = async (req, res) => {
  try {
    const { id: myId } = req.user;
    const { userId } = req.query;
    if (myId == userId) {
      return res.status(400).send("bad request");
    }
    const myProfile = await Profile.findById(myId);
    const followerToRemove = await Profile.findById(userId);
    if (!myProfile) {
      return res.status(400).send("bad request");
    }
    if (!followerToRemove) {
      return res.status(404).send("User not found.");
    }
    const follow = await Follow.findOne({
      followedId: myId,
      followerId: userId,
    });

    if (!follow) {
      return res.status(409).json({ message: "This user is not a follower." });
    }

    const user = await User.findById(myId);

    const notification = await Notification.findById(follow.notificationId);
    if (notification) {
      const socketIdsList = getOnlineUsers().get(myId);
      if (socketIdsList) {
        socketIdsList.map((socketId) => {
          getServerSocketInstance()
            .to(socketId)
            .emit("remove-notification", notification.id);
        });
      }
      if (!notification.isRead) {
        user.unreadNotificationsCount--;
      }
      await notification.deleteOne();
      await user.save();
    }
    if (myProfile.followersCount > 0) {
      myProfile.followersCount -= 1;
      await myProfile.save();
    }

    if (followerToRemove.followingCount > 0) {
      followerToRemove.followingCount -= 1;
      await followerToRemove.save();
    }
    await follow.deleteOne();
    return res.status(200).send("success");
  } catch (err) {
    return handleError(err, res);
  }
};
