import { Types } from "mongoose";
import Conversation from "../models/conversation.js";
import User from "../models/user.js";

import { getServerSocketInstance } from "../socket/socketServer.js";
import { getOnlineUsers } from "../socket/onlineUsers.js";
import { handleError } from "../utils/errorHandler.js";
import Message from "../models/message.js";

const { ObjectId } = Types;

export const getAll = async (req, res) => {
  try {
    const { user } = req;
    let { page } = req.query;
    if (!page) {
      page = 1;
    }

    let conversations = await Conversation.aggregate([
      {
        $match: {
          participants: { $elemMatch: { _id: user._id } },
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "conversationId",
          as: "messages",
          pipeline: [
            { $match: { to: { $elemMatch: { _id: user._id } } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
        },
      },
      {
        $addFields: {
          unreadMessagesCount: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$participants",
                  as: "participant",
                  cond: { $eq: ["$$participant._id", user._id] },
                },
              },
              0,
            ],
          },
          messages: "$messages",
        },
      },
      {
        $project: {
          _id: 1,
          participants: { _id: 1 },
          unreadMessagesCount: {
            $ifNull: ["$unreadMessagesCount.unreadMessagesCount", 0],
          },
          messages: 1,
          updatedAt: 1,
        },
      },
      {
        $sort: {
          updatedAt: -1,
        },
      },
      { $limit: 10 },
      { $skip: page > 0 ? (page - 1) * 10 : 0 },
    ]);

    conversations = conversations.map((conv) => {
      if (conv.messages.length === 0) {
        conv.updatedAt = null;
      }
      return conv;
    });
    return res.status(200).json(conversations);
  } catch (err) {
    return handleError(err, res);
  }
};

export const getOne = async (req, res) => {
  try {
    let { page, conversationId } = req.query;
    const { user } = req;

    page = parseInt(page);
    page = page && page > 0 ? page : 1;

    const conversation = await Conversation.aggregate([
      {
        $match: {
          _id: new ObjectId(conversationId),
          participants: { $elemMatch: { _id: user._id } },
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "conversationId",
          as: "messages",
          pipeline: [
            {
              $match: {
                to: { $elemMatch: { _id: user._id } },
              },
            },
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * 10 },
            { $limit: 10 },
          ],
        },
      },
      {
        $addFields: {
          messages: "$messages",
        },
      },
      {
        $project: {
          _id: 1,
          participants: 1,
          updatedAt: 1,
          messages: 1,
        },
      },
    ]);
    return res.status(200).json(...conversation);
  } catch (err) {
    return handleError(err, res);
  }
};

export const setRead = async (req, res) => {
  try {
    const { user, conversation } = req;

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }
    const par = conversation.participants.id(user.id);
    const messagesInfo = [];
    // if the last read message id is unset then the id will be the minimum ObjectId
    const lastReadMessageId =
      par.lastReadMessageId ?? new ObjectId("000000000000000000000000");

    const unreadMessages = await Message.find({
      conversationId: conversation._id,
      _id: { $gt: lastReadMessageId },
      to: { $elemMatch: { _id: user._id } },
    }).sort({ _id: 1 });

    unreadMessages.forEach((message) => {
      message.info.readBy.addToSet(user.id);
      message.info.deliveredTo.addToSet(user.id);
      par.unreadMessagesCount -= 1;
      messagesInfo.push({ _id: message.id, info: message.info });
    });

    par.lastReadMessageId = unreadMessages[unreadMessages.length - 1]._id;
    await conversation.save();

    await Message.bulkSave(unreadMessages);

    user.unreadMessagesCount -= unreadMessages?.length;
    await user.save();

    conversation.participants.map((participant) => {
      const socketIdsList = getOnlineUsers().get(participant.id);

      if (!socketIdsList) return;

      socketIdsList.map((socketId) => {
        getServerSocketInstance().to(socketId).emit("update-conversation", {
          conversationId: conversation.id,
          messagesInfo,
        });
      });
    });
    return res.status(200).json(conversation[0]?.messages);
  } catch (err) {
    return handleError(err, res);
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { conversation } = req;

    // subtract the unread messages count of the conversation from the overall count
    conversation.participants.map((participant) => {
      const otherParticipant = conversation.participants.find(
        (par) => par.id !== participant.id
      );

      const unreadMessagesCount = participant.unreadMessagesCount;
      User.findById(participant.id).then((doc) => {
        doc.unreadMessagesCount -= unreadMessagesCount;
        doc.contacts.id(otherParticipant.id)?.deleteOne();
        doc.save();
      });

      //send the clearance of the conversations to all participants
      const socketIdsList = getOnlineUsers().get(participant.id);
      if (!socketIdsList) return;

      socketIdsList.map((socketId) => {
        getServerSocketInstance().to(socketId).emit("delete-conversation", {
          conversationId: conversation.id,
          contactId: otherParticipant.id,
        });
      });
    });

    await Message.deleteMany({ conversationId: conversation._id });
    await conversation.deleteOne();

    await User.updateMany(
      { "undeliveredConversations._id": conversation._id },
      { $pull: { undeliveredConversations: { _id: conversation._id } } }
    );

    return res.status(200).send("success");
  } catch (err) {
    return handleError(err, res);
  }
};

export const clear = async (req, res) => {
  try {
    const { forEveryone } = req.query;
    const { user, conversation } = req;

    if (forEveryone === "true") {
      conversation.updatedAt = null;

      // subtract the unread messages count of the conversation from the overall count
      conversation.participants.map((participant) => {
        const unreadMessagesCount = participant.unreadMessagesCount;
        User.findById(participant.id).then((doc) => {
          doc.unreadMessagesCount -= unreadMessagesCount;
          doc.save();
        });
        participant.unreadMessagesCount = 0;
      });
      // clear all messages
      await Message.deleteMany({ conversationId: conversation._id });
      await conversation.save();

      //send the clearance of the conversations to all participants
      conversation.participants.map((participant) => {
        const socketIdsList = getOnlineUsers().get(participant.id);
        if (!socketIdsList) return;

        socketIdsList.map((socketId) => {
          getServerSocketInstance().to(socketId).emit("clear-conversation", {
            conversationId: conversation.id,
          });
        });
      });

      return res.status(200).send("success");
    }

    conversation.participants.id(user.id).unreadMessagesCount = 0;
    await conversation.save();
    /*
    if the message is deleted for everyone except this user, then delete the entire 
    message instead of just deleting the user's ID from "to property
     */
    await Message.deleteMany({
      conversationId: conversation._id,
      to: { $size: 1 },
    });

    await Message.updateMany(
      {
        conversationId: conversation._id,
        $expr: { $gt: [{ $size: "$to" }, 1] },
      },
      { $pull: { to: { _id: user._id } } }
    );

    /*
    send the clearance of the conversations only to 
    the participant who cleared the conversation for themselfe
    */
    const otherParticipant = conversation.participants.find(
      (par) => par.id !== user.id
    );

    const socketIdsList = getOnlineUsers().get(user.id);
    if (!socketIdsList) return;

    socketIdsList.map((socketId) => {
      getServerSocketInstance().to(socketId).emit("clear-conversation", {
        conversationId: conversation.id,
        contactId: otherParticipant.id,
      });
    });

    return res.status(200).send("success");
  } catch (err) {
    return handleError(err, res);
  }
};
