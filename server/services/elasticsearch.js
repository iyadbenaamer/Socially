import { Client } from "@elastic/elasticsearch";
import fs from "fs";
import { config } from "dotenv";

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
  throw new Error("❌ ELASTIC_PASSWORD environment variable is not set");
}

if (ELASTIC_PROTOCOL === "https" && !fs.existsSync(CA_PATH)) {
  throw new Error(`❌ Elasticsearch CA certificate not found at ${CA_PATH}`);
}

// ================== NODE URL ==================
const ELASTIC_NODE = `${ELASTIC_PROTOCOL}://${ELASTIC_HOST}:${ELASTIC_PORT}`;

// ================== CLIENT OPTIONS ==================
const clientOptions = {
  node: ELASTIC_NODE,

  auth: {
    username: ELASTIC_USERNAME,
    password: ELASTIC_PASSWORD,
  },

  sniffOnStart: false,
  sniffInterval: false,
  maxRetries: 5,
  requestTimeout: 30000,
};

// Enable TLS only when using HTTPS
if (ELASTIC_PROTOCOL === "https") {
  clientOptions.tls = {
    ca: fs.readFileSync(CA_PATH),
    rejectUnauthorized: true,
  };
}

// ================== CLIENT ==================
export const client = new Client(clientOptions);

// ================== CONNECTION TEST ==================
(async () => {
  try {
    await client.ping();
    console.log(
      `✅ Elasticsearch connected (${ELASTIC_PROTOCOL.toUpperCase()})`,
    );
  } catch (err) {
    console.error("❌ Elasticsearch connection failed");
    console.error(err.meta?.body || err.message);
  }
})();

// ================== ENSURE INDEX EXISTS ==================
export async function ensureProfilesIndex() {
  const indexName = "profiles";

  const exists = await client.indices.exists({ index: indexName });

  if (!exists) {
    await client.indices.create({
      index: indexName,
      mappings: {
        properties: {
          firstName: { type: "text" },
          lastName: { type: "text" },
          username: { type: "keyword" },
          suggest: { type: "completion" },
        },
      },
    });

    console.log(`✅ Created Elasticsearch index: ${indexName}`);
  }
}
