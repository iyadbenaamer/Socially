import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import Conversation from "./conversation";

import useUpdate from "hooks/useUpdate";
import useInfiniteScroll from "hooks/useInfiniteScroll";
import axiosClient from "utils/AxiosClient";
import { setConversations } from "state";

import LoadingIcon from "assets/icons/loading-circle.svg?react";
import HoverScrollContainer from "components/HoverScrollContainer";

const Conversations = () => {
  const conversations = useSelector((state) => state.conversations);
  const pageRef = useRef(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const dispatch = useDispatch();

  const container = useRef(null);

  useUpdate();

  // Fetch initial conversations
  useEffect(() => {
    setIsInitialLoading(true);
    pageRef.current = 1;
    axiosClient("conversation/all?page=1")
      .then((response) => {
        const data = response.data;
        if (data?.length < 10) {
          setIsFinished(true);
        }
        dispatch(setConversations(data));
        pageRef.current = 2; // Next page will be 2
      })
      .catch((err) => {})
      .finally(() => setIsInitialLoading(false));
  }, [dispatch]);

  // Fetch next page of conversations
  const fetchNextPage = useCallback(async () => {
    if (isLoading || isFinished || isInitialLoading) return;

    setIsLoading(true);
    try {
      const response = await axiosClient(
        `conversation/all?page=${pageRef.current}`,
      );
      const data = response.data;

      if (data?.length > 0) {
        // Deduplicate by _id
        const existingIds = new Set(conversations.map((c) => c._id));
        const newConvs = data.filter((c) => !existingIds.has(c._id));
        dispatch(setConversations([...conversations, ...newConvs]));
        pageRef.current += 1;

        if (data.length < 10) {
          setIsFinished(true);
        }
      } else {
        setIsFinished(true);
      }
    } catch (err) {
      console.error("Failed to fetch next page of conversations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isFinished, isInitialLoading, conversations, dispatch]);

  // Use infinite scroll hook
  const { loadingRef } = useInfiniteScroll(
    fetchNextPage,
    !isFinished,
    isLoading,
    {
      rootMargin: "100px",
      threshold: 0.1,
    },
  );

  return (
    <HoverScrollContainer>
      <ul
        ref={container}
        className="conversations flex flex-col h-full py-4 px-2 gap-2 pb-36 overflow-y-auto"
      >
        {isInitialLoading && (
          <div className="w-8 self-center">
            <LoadingIcon className="icon animate-spin" />
          </div>
        )}

        {conversations?.length === 0 && !isInitialLoading && (
          <div className="mx-2">No conversations yet</div>
        )}

        {conversations?.map((conversation) => (
          <li key={conversation._id}>
            <Conversation conversation={conversation} />
          </li>
        ))}

        {!isFinished && conversations?.length >= 10 && (
          <div ref={loadingRef} className="w-8 self-center">
            <LoadingIcon
              className={`icon ${isLoading ? "animate-spin" : ""}`}
            />
          </div>
        )}
      </ul>
    </HoverScrollContainer>
  );
};

export default Conversations;
