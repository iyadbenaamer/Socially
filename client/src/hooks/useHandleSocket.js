import { io } from "socket.io-client";
import { useDispatch } from "react-redux";
import { useEffect, useRef } from "react";

import {
  addMessage,
  addNewConversation,
  addNotification,
  clearConversation,
  deleteConversation,
  deleteMessage,
  messageLikeToggle,
  removeNotification,
  setNotifyTyping,
  setShowMessage,
  updateActivityStatus,
  updateConversationStatus,
} from "state";

export let socket;

export const connectToSocketServer = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return;
  }
  // if socket object is undefined then establish a socket connection
  if (!socket) {
    socket = io(import.meta.env.VITE_APP_URL, {
      auth: { token },
    });
    return;
  }
  /*
  if socket object is defined but socket.connected is false
  then close the existing one and establish a new connection
  */
  if (!socket.connected) {
    socket.close();
    socket = io(import.meta.env.VITE_APP_URL, {
      auth: { token },
    });
  }
};

const useHandleSocket = () => {
  const dispatch = useDispatch();
  // Track whether we previously got disconnected so we can distinguish
  // the initial connect from a reconnection.
  const wasDisconnectedRef = useRef(false);

  useEffect(() => {
    if (!socket) {
      return;
    }
    const handleReconnect = () => {
      if (wasDisconnectedRef.current) {
        dispatch(
          setShowMessage({
            message: "Connection restored. You're back online.",
            type: "info",
          }),
        );
        wasDisconnectedRef.current = false;
      }
    };
    const handleDisconnect = () => {
      wasDisconnectedRef.current = true;
      try {
        dispatch(
          setShowMessage({
            message: "Connection lost. Please check your internet connection.",
            type: "error",
          }),
        );
      } catch (error) {}
    };

    // Core domain event listeners
    socket.on("contact-connected", (data) => {
      dispatch(
        updateActivityStatus({ id: data.id, isOnline: true, lastSeenAt: null }),
      );
    });
    socket.on("contact-disconnected", (data) => {
      dispatch(
        updateActivityStatus({
          id: data.id,
          isOnline: false,
          lastSeenAt: Date.now(),
        }),
      );
    });
    socket.on("send-message", (data) => {
      dispatch(addMessage(data));
    });
    socket.on("add-new-conversation", (data) => {
      dispatch(addNewConversation(data));
    });
    socket.on("update-conversation", (data) => {
      dispatch(updateConversationStatus(data));
    });
    socket.on("clear-conversation", (data) => {
      dispatch(clearConversation(data));
    });
    socket.on("delete-conversation", (data) => {
      dispatch(deleteConversation(data));
    });
    socket.on("message-like-toggle", (data) => {
      dispatch(messageLikeToggle(data));
    });
    socket.on("delete-message", (data) => {
      dispatch(deleteMessage(data));
    });

    socket.on("notify-typing", (data) => {
      dispatch(setNotifyTyping(data));
    });
    socket.on("push-notification", (data) => {
      dispatch(addNotification(data));
    });

    socket.on("remove-notification", (data) => {
      dispatch(removeNotification(data));
    });

    // Connection lifecycle listeners
    socket.on("disconnect", handleDisconnect);
    // The manager emits reconnect events (after a successful recovery)
    socket.io?.on("reconnect", handleReconnect);

    return () => {
      // Remove domain listeners
      socket.off("contact-connected");
      socket.off("contact-disconnected");
      socket.off("send-message");
      socket.off("add-new-conversation");
      socket.off("update-conversation");
      socket.off("clear-conversation");
      socket.off("delete-conversation");
      socket.off("message-like-toggle");
      socket.off("delete-message");
      socket.off("notify-typing");
      socket.off("push-notification");
      socket.off("remove-notification");
      // Connection lifecycle
      socket.off("disconnect", handleDisconnect);
      socket.io?.off("reconnect", handleReconnect);
    };
  }, [socket]);
};

export const disconnectFromSocketServer = () => {
  socket?.close();
};
export default useHandleSocket;
