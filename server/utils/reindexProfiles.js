import mongoose from "mongoose";
import { Client } from "@elastic/elasticsearch";

import Profile from "../models/profile.js";

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL;
const ELASTICSEARCH_USER = process.env.ELASTICSEARCH_USER;
const ELASTICSEARCH_PASSWORD = process.env.ELASTICSEARCH_PASSWORD;

const MONGO_URI = process.env.MONGO_URI;

// Elasticsearch index configuration
const INDEX_CONFIG = {
  mappings: {
    properties: {
      username: { type: "text" },
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

let clientData;

clientData = {
  node: ELASTICSEARCH_URL,
  auth: {
    username: ELASTICSEARCH_USER,
    password: ELASTICSEARCH_PASSWORD,
  },
  headers: {
    accept: "application/json",
    "content-type": "application/json",
  },
};

const client = new Client(clientData);

const indexProfiles = async () => {
  const profiles = await Profile.find({});
  console.log(`Found ${profiles.length} profiles.`);

  for (const doc of profiles) {
    try {
      await client.index({
        index: "profiles",
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
      console.log(`Indexed profile: ${doc.username}`);
    } catch (err) {
      console.error(
        `Failed to index profile ${doc._id}:`,
        err.meta?.body?.error || err
      );
    }
  }

  await client.indices.refresh({ index: "profiles" });
  console.log("Refreshed index.");
};

// Initialize Elasticsearch
export const initializeElasticsearch = async (reindex = false) => {
  try {
    const indexExists = await client.indices.exists({ index: "profiles" });

    if (indexExists && !reindex) {
      console.log("Elasticsearch index already exists.");
      return;
    }

    console.log("Creating Elasticsearch index...");
    await client.indices.delete({ index: "profiles" }).catch(() => {});
    await client.indices.create({
      index: "profiles",
      body: INDEX_CONFIG,
    });
    console.log("Created 'profiles' index with mapping.");

    await indexProfiles();
    console.log("Elasticsearch initialization complete.");
  } catch (error) {
    console.error("Failed to initialize Elasticsearch:", error);
  }
};

// Only run the full reindex if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      await mongoose.connect(MONGO_URI);
      await initializeElasticsearch(true);
      console.log("Done reindexing.");
      process.exit(0);
    } catch (error) {
      console.error("Reindexing failed:", error);
      process.exit(1);
    }
  })();
}
