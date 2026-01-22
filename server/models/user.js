import { Schema, model, Types } from "mongoose";

const { ObjectId } = Types;

const UserSchema = new Schema(
  {
    email: { type: String, uniqe: true, max: 50 },
    password: {
      type: String,
      required: true,
      min: 8,
      max: 50,
    },
    contacts: {
      type: [{ _id: ObjectId, conversationId: String }],
      rel: "User",
      default: [],
    },
    unreadMessagesCount: { type: Number, default: 0, min: 0 },
    unreadNotificationsCount: { type: Number, default: 0, min: 0 },
    /*
    this is where all undelivered messages are stored, each one will 
    be deliverdTo set once the user is connected
    */
    undeliveredConversations: {
      type: [
        {
          _id: ObjectId,
          participants: {
            type: [{ default: { _id: ObjectId } }],
            default: [],
          },
          messages: {
            type: [{ _id: ObjectId }],
            default: [],
          },
        },
      ],
      default: [],
    },
    verificationStatus: {
      isVerified: { type: Boolean, default: false },
      verificationToken: String,
    },
    resetPasswordToken: String,
    savedPosts: { type: [{ _id: ObjectId }], default: [] },
    favoriteTopics: {
      type: Map,
      of: new Schema({
        count: { type: Number, default: 1 },
      }),
      default: {},
    },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });

const User = model("User", UserSchema);
export default User;
