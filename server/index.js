import express from "express";
import { createServer } from "http";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

import createSocketServer from "./socket/socketServer.js";
import { initializeElasticsearch } from "./utils/reindexProfiles.js";

import authRoute from "./routes/auth.js";
import profileRoute from "./routes/profile.js";
import userRoute from "./routes/user.js";
import savedPostRoute from "./routes/savedPost.js";
import postsRoute from "./routes/posts.js";
import postRoute from "./routes/post.js";
import commentRoute from "./routes/comment.js";
import replyRoute from "./routes/reply.js";
import conversationRoute from "./routes/conversation.js";
import notificationRoute from "./routes/notification.js";
import messageRoute from "./routes/message.js";
import searchRoute from "./routes/search.js";
import adminRoute from "./routes/admin.js";

import { setProfile } from "./controllers/profile.js";
import { getFeedPosts } from "./controllers/posts.js";
import {
  create as createPost,
  share as sharePost,
} from "./controllers/post.js";
import { add as addComment } from "./controllers/comment.js";
import { add as addReply } from "./controllers/reply.js";
import { create } from "./controllers/message.js";

import { verifyToken } from "./middleware/auth.js";
import { verifyId } from "./middleware/check.js";
import { compressImages } from "./middleware/media.js";
import { getPostsInfo } from "./middleware/post.js";
import { uploadSingleFile } from "./middleware/media.js";
import {
  getConversationInfo,
  isInChat,
  newConversationByMessaging,
} from "./middleware/conversation.js";

import connectDB from "./config/db.js";

/*CONFIGURATIONS*/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("short"));
app.use(bodyParser.json({ limit: "200mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "200mb", extended: true }));
app.use(cors());
app.use("/storage", express.static(path.join(__dirname, "public/storage")));
app.use("/assets", express.static(path.join(__dirname, "public/assets")));
app.use(cookieParser(process.env.JWT_SECRET));

/*FILE STORAGE*/

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/storage");
  },
  filename: function (req, file, cb) {
    const ext = (path.extname(file.originalname) || "")
      .slice(0, 10)
      .toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

/*ROUTES WITH FILES*/
app.patch(
  "/api/profile/set",
  verifyToken,
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "coverPic", maxCount: 1 },
  ]),
  compressImages,
  setProfile
);
app.post(
  "/api/post/create",
  verifyId,
  verifyToken,
  upload.fields([{ name: "media" }]),
  compressImages,
  createPost
);
app.post(
  "/api/post/share/",
  verifyId,
  verifyToken,
  upload.fields([{ name: "media" }]),
  compressImages,
  sharePost
);
app.post(
  "/api/message/send",
  verifyId,
  verifyToken,
  upload.fields([{ name: "media" }]),
  compressImages,
  getConversationInfo,
  isInChat,
  create
);
app.post(
  "/api/message/send_first_time",
  verifyId,
  verifyToken,
  upload.fields([{ name: "media" }]),
  compressImages,
  newConversationByMessaging,
  create
);
app.post(
  "/api/message/reply",
  verifyId,
  verifyToken,
  upload.fields([{ name: "media" }]),
  compressImages,
  getConversationInfo,
  isInChat,
  create
);
app.post(
  "/api/comment/add",
  verifyId,
  verifyToken,
  upload.single("media"),
  uploadSingleFile,
  getPostsInfo,
  addComment
);
app.post(
  "/api/reply/add",
  verifyId,
  verifyToken,
  upload.single("media"),
  uploadSingleFile,
  getPostsInfo,
  addReply
);
/*ROUTES*/
app.use("/api/", userRoute);
app.use("/api/", savedPostRoute);
app.use("/api/", authRoute);
app.use("/api/home", getFeedPosts);
app.use("/api/profile", profileRoute);
app.use("/api/posts", postsRoute);
app.use("/api/post", postRoute);
app.use("/api/comment", commentRoute);
app.use("/api/reply", replyRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/conversation", conversationRoute);
app.use("/api/message", messageRoute);
app.use("/api/search", searchRoute);
app.use("/api/admin", adminRoute);

/*MONGOOSE SETUP*/
connectDB();

const PORT = process.env.PORT;
const server = createServer(app);
createSocketServer(server);

const startServer = async () => {
  try {
    // Initialize Elasticsearch
    await initializeElasticsearch();

    // Start the server
    server.listen(PORT, () => console.log(`Server Connected on Port: ${PORT}`));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
