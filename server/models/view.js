import { model, Schema, Types } from "mongoose";

const { ObjectId } = Types;

const ViewSchema = new Schema({
  userId: ObjectId,
  postId: ObjectId,
  createdAt: Number,
});

// Ensure a single view per user per post, even under concurrency
ViewSchema.index({ postId: 1, userId: 1 }, { unique: true });

const View = model("View", ViewSchema);
export default View;
