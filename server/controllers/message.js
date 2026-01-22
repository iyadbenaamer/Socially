import Message from "../models/message.js";
import User from "../models/user.js";

import { getOnlineUsers } from "../socket/onlineUsers.js";
import { getServerSocketInstance } from "../socket/socketServer.js";
import { handleError } from "../utils/errorHandler.js";

export const create = async (req, res) => {
  try {
    const { filesInfo, user, conversation } = req;
    const { replyTo } = req.query;
    let { text } = req.body;
    text = text ? text.trim() : "";
    const now = Date.now();
    const onlineUsersMap = getOnlineUsers();

    if (text === "" && filesInfo.length === 0) {
      return res
        .status(400)
        .json({ message: "Message must contain text or media." });
    }

    if (text.length > 100000) {
      return res.status(400).json({ message: "Message text is too long." });
    }

    // Determine which participants are currently online (include sender)
    const deliveredToSet = [];
    for (const participant of conversation.participants) {
      const socketIdsList = onlineUsersMap.get(participant.id);
      if (socketIdsList) {
        deliveredToSet.push({ _id: participant._id });
      }
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: user.id,
      to: conversation.participants,
      text,
      files: filesInfo,
      info: {
        readBy: [{ _id: user.id }],
        deliveredTo: deliveredToSet,
      },
      replyTo: replyTo ? replyTo : null,
      createdAt: now,
    });

    // Update conversation metadata & unread counts
    conversation.updatedAt = now;
    const senderSubDoc = conversation.participants.id(user.id);
    if (senderSubDoc) {
      senderSubDoc.lastReadMessageId = message._id;
    }

    // Collect participant user docs for offline handling
    const participantUserDocs = new Map();

    for (const participant of conversation.participants) {
      if (participant.id !== user.id) {
        participant.unreadMessagesCount += 1;
      }
      // Fetch user doc once
      const userDoc = await User.findById(participant._id);

      if (userDoc) {
        participantUserDocs.set(participant.id, userDoc);
        if (participant.id !== user.id) {
          userDoc.unreadMessagesCount += 1;
        }
      }
    }

    // Persist conversation after unread counters updated
    await conversation.save();

    // Handle undelivered logic & socket emission
    for (const participant of conversation.participants) {
      const participantDoc = participantUserDocs.get(participant.id);
      if (!participantDoc) continue;

      const socketIdsList = onlineUsersMap.get(participant.id);
      if (socketIdsList && socketIdsList.length > 0) {
        // Emit to each active socket
        for (const socketId of socketIdsList) {
          getServerSocketInstance().to(socketId).emit("send-message", {
            conversationId: conversation.id,
            message,
            unreadMessagesCount: participant.unreadMessagesCount,
            updatedAt: conversation.updatedAt,
          });
        }
      } else if (participant.id !== user.id) {
        // Offline receiver: track undelivered
        const undeliveredConversation =
          participantDoc.undeliveredConversations.id(conversation.id);
        if (undeliveredConversation) {
          undeliveredConversation.messages.unshift({ _id: message._id });
        } else {
          participantDoc.undeliveredConversations.addToSet({
            _id: conversation._id,
            participants: conversation.participants,
            messages: [{ _id: message._id }],
          });
        }
      }
      await participantDoc.save();
    }

    return res.status(201).json({ messageId: message._id });
  } catch (err) {
    return handleError(err, res);
  }
};

export const likeToggle = async (req, res) => {
  try {
    const { user, conversation, message } = req;

    // if the message is deleted for the user or for everyone or it's not exist return not found.
    if (!message?.to.id(user._id) || !message) {
      return res.status(404).json({ message: "message not found" });
    }

    // if the message is liked by the user then remove their id from likedBy array.
    if (message.info.likedBy.id(user._id)) {
      message.info.likedBy.id(user._id).deleteOne();
    } else {
      // otherwise add their id to likedBy array.
      message.info.likedBy.addToSet(user._id);
    }

    // conversation.updatedAt is only updated when a new message is sent or when messages is liked
    conversation.updatedAt = Date.now();

    // if user is online then send the message update by socket
    conversation.participants.map((participant) => {
      const socketIdsList = getOnlineUsers().get(participant.id);
      if (socketIdsList) {
        socketIdsList.map((socketId) => {
          getServerSocketInstance().to(socketId).emit("message-like-toggle", {
            conversationId: conversation.id,
            message,
            updatedAt: conversation.updatedAt,
          });
        });
      }
    });

    await conversation.save();
    return res.status(200).json(message);
  } catch (err) {
    return handleError(err, res);
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { forEveryone } = req.query;
    const { user, conversation, message } = req;

    const participantId = conversation.participants.find(
      (participant) => participant.id !== user.id
    );
    const participantProfile = await User.findById(participantId);
    /*
    if the message is not read by the other participant then decrease
    unreadMessagesCount by one.
    */
    if (message.info.readBy.length === 1) {
      conversation.participants.id(participantId).unreadMessagesCount -= 1;
      if (participantProfile?.unreadMessagesCount > 0) {
        participantProfile.unreadMessagesCount -= 1;
      }
    }
    /*
    if the message is not delivered to the other participant then delete
    the message from undeliveredConversations for the other participant.
    */
    if (message.info.deliveredTo.length === 1) {
      const undeliveredConversation =
        participantProfile?.undeliveredConversations.id(conversation.id);
      /*
      if the conversation has only one message delete the entire
      conversation, otherwise delete the message from
      "undeliveredConversations.messages".
      */
      if (undeliveredConversation?.messages?.length === 1) {
        undeliveredConversation.deleteOne();
      } else {
        undeliveredConversation?.messages.id(message.id).deleteOne();
      }
    }
    await participantProfile?.save();
    /*
    if the message is deleted for the other user or deletion option
    is for everyone , then delete the entire message instead of just deleting
    the user's ID from "to" property.
    */
    if (forEveryone === "true" || message.to.length === 1) {
      await message.deleteOne();
    } else {
      await message.updateOne({ $pull: { to: { _id: user._id } } });
    }
    const lastMessage = await Message.findOne({
      conversation: conversation.id,
    }).sort({ createdAt: -1 });
    if (lastMessage) {
      conversation.updatedAt = lastMessage.createdAt;
    } else {
      conversation.updatedAt = null;
    }
    await conversation.save();
    /*
    if the deletion is for everyone and the user is
    online then send the message update by socket
    */
    if (forEveryone === "true") {
      conversation.participants.map((participant) => {
        const socketIdsList = getOnlineUsers().get(participant.id);
        if (socketIdsList) {
          socketIdsList.map((socketId) => {
            const { unreadMessagesCount } = participant;
            let data;
            if (participant.id !== user.id) {
              data = {
                conversationId: conversation.id,
                messageId: message.id,
                unreadMessagesCount,
                updatedAt: conversation.updatedAt,
              };
            } else {
              data = {
                conversationId: conversation.id,
                messageId: message.id,
                updatedAt: conversation.updatedAt,
              };
            }
            getServerSocketInstance().to(socketId).emit("delete-message", data);
          });
        }
      });
    }
    /*
    if the deletion is not for everyone then send the message
    update by socket to the user
    */
    if (forEveryone === "false") {
      const socketIdsList = getOnlineUsers().get(user.id);
      if (socketIdsList) {
        socketIdsList.map((socketId) => {
          let data;
          data = {
            conversationId: conversation.id,
            messageId: message.id,
            updatedAt: conversation.updatedAt,
          };
          getServerSocketInstance().to(socketId).emit("delete-message", data);
        });
      }
    }

    return res.status(200).send("success");
  } catch (err) {
    return handleError(err, res);
  }
};
