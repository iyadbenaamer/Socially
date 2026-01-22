import { model, Schema, Types } from "mongoose";

const { ObjectId } = Types;

const ReplyLikeSchema = new Schema({
  userId: ObjectId,
  postId: ObjectId,
  replyId: ObjectId,
  notificationId: ObjectId,
  createdAt: Number,
});

ReplyLikeSchema.index({ postId: 1 });
ReplyLikeSchema.index({ replyId: 1 });

const ReplyLike = model("ReplyLike", ReplyLikeSchema);
export default ReplyLike;
