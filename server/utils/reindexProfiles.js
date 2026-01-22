import mongoose from "mongoose";
import { Client } from "@elastic/elasticsearch";
import fs from "fs";
import { config } from "dotenv";

import Profile from "../models/profile.js";

config();
// ================== CONFIG ==================
const ELASTIC_PROTOCOL = process.env.ELASTIC_PROTOCOL || "https";
const ELASTIC_HOST = process.env.ELASTIC_HOST || "127.0.0.1";
const ELASTIC_PORT = process.env.ELASTIC_PORT || "9200";
const ELASTIC_USERNAME = process.env.ELASTIC_USERNAME || "elastic";
const ELASTIC_PASSWORD = process.env.ELASTIC_PASSWORD;

// CA path only needed for HTTPS
const CA_PATH = process.env.ELASTICSEARCH_CA_PATH || "";

// ================== VALIDATION ==================
if (!ELASTIC_PASSWORD) {
  throw new Error("❌ ELASTIC_PASSWORD is not set");
}

if (ELASTIC_PROTOCOL === "https" && !fs.existsSync(CA_PATH)) {
  throw new Error(`❌ Elasticsearch CA not found at ${CA_PATH}`);
}

// ================== CLIENT ==================
const clientOptions = {
  node: `${ELASTIC_PROTOCOL}://${ELASTIC_HOST}:${ELASTIC_PORT}`,

  auth: {
    username: ELASTIC_USERNAME,
    password: ELASTIC_PASSWORD,
  },

  sniffOnStart: false,
  sniffInterval: false,
  maxRetries: 5,
  requestTimeout: 30000,
};

if (ELASTIC_PROTOCOL === "https") {
  clientOptions.tls = {
    ca: fs.readFileSync(CA_PATH),
    rejectUnauthorized: true,
  };
}

const client = new Client(clientOptions);

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
      mappings: INDEX_CONFIG.mappings,
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
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
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
