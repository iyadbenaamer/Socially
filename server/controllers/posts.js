import { Types } from "mongoose";

import Post from "../models/post.js";
import Profile from "../models/profile.js";

import { handleError } from "../utils/errorHandler.js";
import Follow from "../models/follow.js";

const getGeneralPipelines = (myId, match) => [
  {
    $lookup: {
      from: "posts",
      let: {
        sharedPostId: "$sharedPost._id",
        currentUserId: myId,
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
              currentUserId: myId,
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
  { $sort: { createdAt: -1 } },
  {
    $addFields: {
      isSharedNull: { $eq: ["$sharedPost", null] },
    },
  },
  {
    $lookup: {
      from: "postlikes",
      let: { postId: "$_id", userId: myId },
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
      let: { postId: "$_id", userId: myId },
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
      let: { postId: "$_id", userId: myId },
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
    $match: {
      ...match,
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
        currentUserId: myId,
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
      isViewed: myId ? { $gt: [{ $size: "$userViewsArr" }, 0] } : true,
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
];

export const getFeedPosts = async (req, res) => {
  try {
    const { user } = req;
    // TODO: enhance feed collection
    const limit = 3;

    // Prepare aggregation pipelines
    const followingIds = await Follow.find({ followerId: user._id }).distinct(
      "followedId",
    );

    const followedPipeLines = getGeneralPipelines(user._id, {
      creatorId: { $in: followingIds },
      $expr: { $eq: [{ $size: "$userViewsArr" }, 0] },
    });

    const favoritePipeLines = getGeneralPipelines(user._id, {
      keywords: { $in: [...user.favoriteTopics.keys()] },
      creatorId: { $ne: user._id },
      $expr: { $eq: [{ $size: "$userViewsArr" }, 0] },
    });

    const followedUsersPipeline = [...followedPipeLines, { $limit: 10 }];

    const favoriteTopicsPipeline = [...favoritePipeLines, { $limit: 10 }];

    let followedPosts = [];
    let topicPosts = [];
    if (followingIds?.length > 0) {
      followedPosts = await Post.aggregate(followedUsersPipeline);
    }
    if (user.favoriteTopics.size > 0) {
      topicPosts = await Post.aggregate(favoriteTopicsPipeline);
    }

    // Shuffle to avoid obvious patterns
    const combinedPosts = [...followedPosts, ...topicPosts];
    let shuffledPosts = combinedPosts
      .sort(() => 0.5 - Math.random())
      .slice(0, limit);
    shuffledPosts = await Promise.all(
      shuffledPosts.map(async (post) => {
        if (!post.sharedPost) {
          return post;
        } else {
          const sharedPost = await Post.findById(post.sharedPost._id);
          if (sharedPost) {
            const sharedPostProfile = await Profile.findById(
              sharedPost.creatorId,
            );
            post.sharedPost = {
              ...sharedPost.toObject(),
              profile: sharedPostProfile,
            };
          } else {
            post.sharedPost = { isDeleted: true };
          }
          return post;
        }
      }),
    );
    return res.json(shuffledPosts);
  } catch (err) {
    return handleError(err, res);
  }
};

export const getUserPosts = async (req, res) => {
  try {
    let { userId, cursor: cursorDate } = req.query;
    const myId = req.user?._id;
    cursorDate = parseInt(cursorDate);
    cursorDate = cursorDate ? cursorDate : Date.now();
    const pipelines = getGeneralPipelines(myId, {
      creatorId: new Types.ObjectId(userId),
      createdAt: { $lt: cursorDate },
    });
    let posts = await Post.aggregate([...pipelines]);
    return res.status(200).json(posts);
  } catch (err) {
    return handleError(err, res);
  }
};
