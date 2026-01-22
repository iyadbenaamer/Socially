import Profile from "../models/profile.js";
import { client } from "../services/elasticsearch.js";
import { handleError } from "../utils/errorHandler.js";
import { Types } from "mongoose";

const INDEX_NAME = "profiles";

// Build search query for partial and fuzzy matching
const buildSearchQuery = (searchTerm) => {
  const term = searchTerm.trim().toLowerCase();
  const terms = term.split(/\s+/); // Split by one or more spaces

  return {
    bool: {
      should: [
        // Full name search using multi_match
        {
          multi_match: {
            query: term,
            fields: ["firstName^3", "lastName^3", "username^2"],
            type: "best_fields",
            operator: "or",
            boost: 4,
          },
        },
        // Individual term search
        ...terms.map((t) => ({
          multi_match: {
            query: t,
            fields: ["firstName^2", "lastName^2", "username^1.5"],
            type: "best_fields",
            operator: "or",
            boost: 2,
          },
        })),
        // Wildcard matches for partial text
        {
          bool: {
            should: [
              { wildcard: { username: { value: `*${term}*`, boost: 1.5 } } },
              { wildcard: { firstName: { value: `*${term}*`, boost: 1 } } },
              { wildcard: { lastName: { value: `*${term}*`, boost: 1 } } },
            ],
          },
        },
        // Fuzzy matches for typo tolerance
        {
          bool: {
            should: [
              {
                fuzzy: {
                  username: { value: term, fuzziness: "AUTO", boost: 0.8 },
                },
              },
              {
                fuzzy: {
                  firstName: { value: term, fuzziness: "AUTO", boost: 0.7 },
                },
              },
              {
                fuzzy: {
                  lastName: { value: term, fuzziness: "AUTO", boost: 0.7 },
                },
              },
            ],
          },
        },
      ],
      minimum_should_match: 1,
    },
  };
};

// Build prefix query for autocomplete
const buildPrefixQuery = (searchTerm) => {
  const term = searchTerm.trim().toLowerCase();
  return {
    bool: {
      should: [
        {
          prefix: {
            username: {
              value: term,
              boost: 2.0,
            },
          },
        },
        {
          prefix: {
            firstName: {
              value: term,
              boost: 1.0,
            },
          },
        },
        {
          prefix: {
            lastName: {
              value: term,
              boost: 1.0,
            },
          },
        },
      ],
      minimum_should_match: 1,
    },
  };
};

// Process search results and fetch full profile data using aggregation
const processSearchResults = async (searchResults, userId) => {
  const ids = searchResults.hits.hits.map((hit) => hit._id);
  if (!ids || ids.length === 0) return [];

  const objectIds = ids.map((id) => new Types.ObjectId(id));

  // Build aggregation pipeline to preserve ES order and compute counts
  const pipeline = [
    { $match: { _id: { $in: objectIds } } },
    {
      $addFields: {
        __order: { $indexOfArray: [ids, { $toString: "$_id" }] },
      },
    },
    // Project core fields and ensure numeric follower/following counts
    {
      $project: {
        firstName: 1,
        lastName: 1,
        username: 1,
        profilePicPath: 1,
        bio: 1,
        followersCount: { $ifNull: ["$followersCount", 0] },
        followingCount: { $ifNull: ["$followingCount", 0] },
        joinedAt: 1,
        __order: 1,
      },
    },
  ];

  // If we have an authenticated user, lookup follow documents to compute isFollowing
  if (userId) {
    pipeline.push(
      {
        $lookup: {
          from: "follows",
          let: { targetUserId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$followedId", "$$targetUserId"] },
                    { $eq: ["$followerId", new Types.ObjectId(userId)] },
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
    );
  } else {
    // Unauthenticated users are not following anyone
    pipeline.push({ $addFields: { isFollowing: false } });
  }

  // Sort by the original Elasticsearch order
  pipeline.push({ $sort: { __order: 1 } });

  // Final projection to match previous shape (`followers` and `following` fields)
  pipeline.push({
    $project: {
      _id: 1,
      followers: "$followersCount",
      following: "$followingCount",
      firstName: 1,
      lastName: 1,
      username: 1,
      profilePicPath: 1,
      bio: 1,
      joinedAt: 1,
      isFollowing: 1,
    },
  });

  const profiles = await Profile.aggregate(pipeline);
  return profiles;
};

// Main search endpoint
export const search = async (req, res) => {
  try {
    let { query } = req.query;
    query = query?.trim();
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    if (query.length > 1000) {
      return res
        .status(400)
        .json({ message: "Search query exceeds maximum length" });
    }

    const searchResults = await client.search({
      index: INDEX_NAME,
      query: buildSearchQuery(query),
    });

    const userId = req.user?._id || req.user?.id;
    const profiles = await processSearchResults(searchResults, userId);
    return res.json(profiles);
  } catch (err) {
    return handleError(err, res);
  }
};

// Autocomplete endpoint
export const autocomplete = async (req, res) => {
  try {
    let { text } = req.query;
    text = text?.trim();

    if (!text) {
      return res.json([]);
    }

    if (text.length > 1000) {
      return res
        .status(400)
        .json({ message: "Autocomplete text exceeds maximum length" });
    }

    const searchResults = await client.search({
      index: INDEX_NAME,
      query: buildPrefixQuery(text),
      size: 20,
      sort: [{ _score: { order: "desc" } }],
    });

    // Extract unique suggestions from results while preserving order
    const seen = new Set();
    const suggestions = searchResults.hits.hits
      .map((hit) => {
        const source = hit._source;
        const results = [];

        // Add username if it matches
        if (source.username.toLowerCase().startsWith(text.toLowerCase())) {
          results.push(source.username.toLowerCase());
        }

        // Add first name if it matches
        if (source.firstName.toLowerCase().startsWith(text.toLowerCase())) {
          results.push(source.firstName.toLowerCase());
        }

        // Add last name if it matches
        if (source.lastName.toLowerCase().startsWith(text.toLowerCase())) {
          results.push(source.lastName.toLowerCase());
        }

        // Add full name if it matches
        const fullName = `${source.firstName} ${source.lastName}`.toLowerCase();
        if (fullName.startsWith(text.toLowerCase())) {
          results.push(fullName);
        }

        return results;
      })
      .flat()
      .filter((suggestion) => {
        if (seen.has(suggestion)) return false;
        seen.add(suggestion);
        return true;
      })
      .slice(0, 10); // Limit to 10 results after deduplication

    return res.json(suggestions);
  } catch (err) {
    return handleError(err, res);
  }
};
