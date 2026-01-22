import { Client } from "@elastic/elasticsearch";
import { config } from "dotenv";
import fs from "fs";

config();

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL;
const ELASTICSEARCH_USER = process.env.ELASTICSEARCH_USER;
const ELASTICSEARCH_PASSWORD = process.env.ELASTICSEARCH_PASSWORD;
const ELASTICSEARCH_HTTPS = process.env.ELASTICSEARCH_HTTPS === "true";
const ELASTICSEARCH_CA_PATH = process.env.ELASTICSEARCH_CA_PATH || null;
const ELASTICSEARCH_REJECT_UNAUTHORIZED =
  process.env.ELASTICSEARCH_REJECT_UNAUTHORIZED !== "false";

let clientData = {
  node: ELASTICSEARCH_URL,
  auth: {
    username: ELASTICSEARCH_USER,
    password: ELASTICSEARCH_PASSWORD,
  },
};

if (ELASTICSEARCH_HTTPS) {
  // ensure URL uses https protocol when requested
  if (clientData.node && !/^https?:\/\//i.test(clientData.node)) {
    clientData.node = `https://${clientData.node}`;
  }

  // attach ssl options for TLS support
  clientData.ssl = {
    rejectUnauthorized: !!ELASTICSEARCH_REJECT_UNAUTHORIZED,
  };

  // load CA if path provided (useful for self-signed certs)
  if (ELASTICSEARCH_CA_PATH) {
    try {
      clientData.ssl.ca = fs.readFileSync(ELASTICSEARCH_CA_PATH);
    } catch (err) {
      // don't throw here; log a warning so service can still start
      // eslint-disable-next-line no-console
      console.warn(
        `Failed to read ELASTICSEARCH_CA_PATH (${ELASTICSEARCH_CA_PATH}): ${err.message}`,
      );
    }
  }
}

export const client = new Client(clientData);
