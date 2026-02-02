import { Types } from "mongoose";

import User from "../models/user.js";
import Conversation from "../models/conversation.js";
import Message from "../models/message.js";

import { getOnlineUsers } from "../socket/onlineUsers.js";
import { getServerSocketInstance } from "../socket/socketServer.js";
import { handleError } from "../utils/errorHandler.js";
import Profile from "../models/profile.js";

const { ObjectId } = Types;

export const newConversationByFollow = async (req, res, next) => {
  try {
    const { user } = req;
    const myId = user.id;
    const { userId: accountToMessageId } = req.query;

    // check if the conversation is already existing
    let conversation = await Conversation.findOne({
      participants: {
        $all: [
          { $elemMatch: { _id: new ObjectId(myId) } },
          { $elemMatch: { _id: new ObjectId(accountToMessageId) } },
        ],
      },
    });

    if (conversation) {
      console.log(conversation);
      return next();
    }

    conversation = await Conversation.create({
      participants: [
        { _id: new ObjectId(myId) },
        { _id: new ObjectId(accountToMessageId) },
      ],
    });
    await conversation.save();
    user.contacts.addToSet({
      _id: accountToMessageId,
      conversationId: conversation.id,
    });
    await user.save();

    const userToMessage = await User.findById(accountToMessageId);
    userToMessage.contacts.addToSet({
      _id: myId,
      conversationId: conversation.id,
    });
    await userToMessage.save();

    conversation.participants.map(async (participant) => {
      const otherParticipant = conversation.participants.find(
        (par) => par.id !== participant.id,
      );
      const socketIdsList = getOnlineUsers().get(participant.id);
      const otherParticipantSocketIdsList = getOnlineUsers().get(
        otherParticipant.id,
      );

      if (socketIdsList) {
        const otherParticipantProfile = await Profile.findById(
          otherParticipant.id,
        );
        /*
        if the user is online send a the new conversation 
        with the new contact by socket
        */
        socketIdsList.map((socketId) => {
          getServerSocketInstance()
            .to(socketId)
            .emit("add-new-conversation", {
              conversation: { ...conversation.toObject(), messages: [] },
              contact: {
                _id: otherParticipant.id,
                conversationId: conversation.id,
                isOnline: otherParticipantSocketIdsList ? true : false,
                ...otherParticipantProfile?.toObject(),
              },
            });
        });
      }
    });

    next();
  } catch (err) {
    return handleError(err, res);
  }
};

export const newConversationByMessaging = async (req, res, next) => {
  try {
    const { user } = req;
    const myId = user.id;
    const { userId: accountToMessageId } = req.query;

    // check if the conversation is already existing
    let conversation = await Conversation.findOne({
      participants: {
        $all: [
          { $elemMatch: { _id: new ObjectId(myId) } },
          { $elemMatch: { _id: new ObjectId(accountToMessageId) } },
        ],
      },
    });

    if (conversation) {
      return res.status(409).json({ message: "Conversation is alrady exist." });
    }

    conversation = await Conversation.create({
      participants: [
        { _id: new ObjectId(myId) },
        { _id: new ObjectId(accountToMessageId) },
      ],
    });
    await conversation.save();
    user.contacts.addToSet({
      _id: accountToMessageId,
      conversationId: conversation.id,
    });
    await user.save();

    const userToMessage = await User.findById(accountToMessageId);
    userToMessage.contacts.addToSet({
      _id: myId,
      conversationId: conversation.id,
    });
    await userToMessage.save();
    req.conversation = conversation;

    conversation.participants.map(async (participant) => {
      const otherParticipant = conversation.participants.find(
        (par) => par.id !== participant.id,
      );
      const socketIdsList = getOnlineUsers().get(participant.id);
      const otherParticipantSocketIdsList = getOnlineUsers().get(
        otherParticipant.id,
      );
      if (socketIdsList) {
        const otherParticipantProfile = await Profile.findById(
          otherParticipant.id,
        );
        /*
        if the user is online send a the new conversation 
        with the new contact by socket
        */
        socketIdsList.map((socketId) => {
          getServerSocketInstance()
            .to(socketId)
            .emit("add-new-conversation", {
              conversation: { ...conversation.toObject(), messages: [] },
              contact: {
                _id: otherParticipant.id,
                conversationId: conversation.id,
                isOnline: otherParticipantSocketIdsList ? true : false,
                ...otherParticipantProfile?.toObject(),
              },
            });
        });
      }
    });

    next();
  } catch (err) {
    return handleError(err, res);
  }
};

export const getConversationInfo = async (req, res, next) => {
  try {
    const { conversationId, messageId } = req.query;
    if (!conversationId) {
      return res.status(400).json({ message: "Bad request." });
    }
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    req.conversation = conversation;

    if (messageId) {
      const message = await Message.findById(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found." });
      }
      req.message = message;
    }
    next();
  } catch (err) {
    return handleError(err, res);
  }
};

export const isInChat = (req, res, next) => {
  try {
    const { user, conversation } = req;
    if (conversation.participants.id(user.id)) {
      next();
    } else {
      return res.status(403).json({ message: "You're not in this chat." });
    }
  } catch (err) {
    return handleError(err, res);
  }
};
