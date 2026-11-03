import mongoose from "mongoose";

import Profile from "../models/profile.js";
import {
  client,
  isElasticsearchEnabled,
} from "../services/elasticsearch.js";
import { pathToFileURL } from "url";

// MongoDB URI
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/socially";

// ================== INDEX CONFIG ==================
const INDEX_NAME = "profiles";

const INDEX_CONFIG = {
  mappings: {
    properties: {
      username: { type: "keyword" },
      firstName: { type: "text" },
      lastName: { type: "text" },
      suggest: {
        type: "completion",
        analyzer: "simple",
        preserve_separators: true,
        preserve_position_increments: true,
        max_input_length: 50,
      },
    },
  },
};

// ================== INDEXING ==================
const indexProfiles = async () => {
  const profiles = await Profile.find({});
  console.log(`🔎 Found ${profiles.length} profiles`);

  for (const doc of profiles) {
    try {
      await client.index({
        index: INDEX_NAME,
        id: doc._id.toString(),
        document: {
          username: doc.username,
          firstName: doc.firstName,
          lastName: doc.lastName,
          suggest: {
            input: [doc.username, doc.firstName, doc.lastName],
          },
        },
      });

      console.log(`✅ Indexed: ${doc.username}`);
    } catch (err) {
      console.error(
        `❌ Failed to index ${doc._id}`,
        err.meta?.body?.error || err.message,
      );
    }
  }

  await client.indices.refresh({ index: INDEX_NAME });
  console.log("🔄 Index refreshed");
};

// ================== INITIALIZER ==================
export const initializeElasticsearch = async (reindex = false) => {
  if (!isElasticsearchEnabled) return;

  try {
    const exists = await client.indices.exists({ index: INDEX_NAME });

    if (exists && !reindex) {
      console.log("ℹ️ Elasticsearch index already exists");
      return;
    }

    console.log("🧹 Recreating Elasticsearch index...");
    await client.indices.delete({ index: INDEX_NAME }).catch(() => {});
    await client.indices.create({
      index: INDEX_NAME,
      body: INDEX_CONFIG,
    });

    console.log("✅ Index created");
    await indexProfiles();
    console.log("🎉 Elasticsearch initialization complete");
  } catch (error) {
    console.error("❌ Elasticsearch init failed:", error.meta?.body || error);
    throw error;
  }
};

// ================== CLI MODE ==================
const entryFile = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;

if (entryFile && import.meta.url === entryFile) {
  (async () => {
    try {
      if (!isElasticsearchEnabled) {
        console.log("ℹ️ Elasticsearch is disabled; skipping reindexing");
        process.exit(0);
      }

      await mongoose.connect(MONGO_URI);
      console.log("✅ MongoDB connected");

      await initializeElasticsearch(true);

      console.log("🏁 Reindexing finished");
      process.exit(0);
    } catch (error) {
      console.error("❌ Reindexing failed:", error);
      process.exit(1);
    }
  })();
}
