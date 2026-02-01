import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  Fragment,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";

import { addMessages, setConversation, setConversationRead } from "state";

import Message from "./message";

import { SelectedChatContext } from "pages/messaging";
import axiosClient from "utils/AxiosClient";
import Time from "components/time";
import useInfiniteScroll from "hooks/useInfiniteScroll";

import LoadingIcon from "assets/icons/loading-circle.svg?react";

const MessagesArea = (props) => {
  const dispatch = useDispatch();
  const { conversation } = useContext(SelectedChatContext);
  const navigate = useNavigate();
  const { conversationId } = useParams();

  // Pagination state
  const [page, setPage] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [isMessagesFinished, setIsMessagesFinished] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  // Refs
  const container = useRef(null);

  const firstUnreadMessageId = useMemo(
    () => conversation.messages[props.unreadMessagesCount - 1]?._id,
    [conversation.messages, props.unreadMessagesCount],
  );

  // Reset pagination state when conversation changes
  useEffect(() => {
    setPage(1);
    setIsMessagesFinished(false);
    setIsLoading(false);

    // Reset scroll position
    if (container.current) {
      container.current.scrollTop = 0;
    }
  }, [conversationId]);

  // Mark conversation as read
  useEffect(() => {
    if (conversation?.unreadMessagesCount) {
      axiosClient
        .patch(`/conversation/set_read?conversationId=${conversation._id}`)
        .then(() => dispatch(setConversationRead(conversation._id)))
        .catch((err) => {
          console.error("Failed to mark conversation as read:", err);
        });
    }
  }, [conversation?._id, conversation?.unreadMessagesCount, dispatch]);

  // Close chat with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsClosed(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch initial messages
  useEffect(() => {
    if (!conversation?._id) return;

    setIsLoading(true);
    axiosClient(`/conversation/?conversationId=${conversation._id}&page=1`)
      .then((response) => {
        const { messages } = response?.data;
        if (messages?.length < 10) {
          setIsMessagesFinished(true);
        }
        dispatch(setConversation(response.data));
      })
      .catch((err) => {
        console.error("Failed to fetch initial messages:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [conversationId, conversation?._id, dispatch]);

  // Fetch next page of messages
  const fetchNextPage = useCallback(async () => {
    if (isLoading || isMessagesFinished || !conversation?._id) return;

    setIsLoading(true);
    try {
      const response = await axiosClient(
        `/conversation/?conversationId=${conversation._id}&page=${page}`,
      );

      const { _id: id, messages } = response?.data;

      if (messages?.length > 0) {
        dispatch(addMessages({ id, messages }));
        setPage((prev) => prev + 1);

        if (messages.length < 10) {
          setIsMessagesFinished(true);
        }
      } else {
        setIsMessagesFinished(true);
      }
    } catch (err) {
      console.error("Failed to fetch next page:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, isMessagesFinished, conversation?._id, dispatch]);

  // Use infinite scroll hook
  const { loadingRef } = useInfiniteScroll(
    fetchNextPage,
    !isMessagesFinished,
    isLoading,
    {
      rootMargin: "100px",
      threshold: 0.1,
    },
  );

  if (isClosed) {
    navigate("/messages", { replace: true });
    return null;
  }

  return (
    <div
      ref={container}
      className="overflow-y-scroll flex flex-col-reverse gap-4 py-10 px-2 h-full"
    >
      {conversation?.messages?.map((message, i) => {
        const thisMessageDate = new Date(message.createdAt);
        const nextMessageDate = new Date(
          conversation.messages[i + 1]?.createdAt,
        );
        const isToday =
          thisMessageDate.getDate() === nextMessageDate.getDate() &&
          thisMessageDate.getMonth() === nextMessageDate.getMonth() &&
          thisMessageDate.getFullYear() === nextMessageDate.getFullYear();

        return (
          <Fragment key={message._id}>
            <Message message={message} />
            {!isToday && (
              <div className="self-center bg-200 px-3 p-1 rounded-xl w-fit">
                <Time date={message.createdAt} withDate forChat />
              </div>
            )}
            {firstUnreadMessageId === message._id && (
              <div className="self-center bg-300 px-3 p-1 rounded-xl shadow-sm">
                Unread Messages
              </div>
            )}
          </Fragment>
        );
      })}

      {!isMessagesFinished && (
        <div ref={loadingRef} className="w-8 center py-2">
          <LoadingIcon className={`icon ${isLoading ? "animate-spin" : ""}`} />
        </div>
      )}
    </div>
  );
};

export default MessagesArea;
