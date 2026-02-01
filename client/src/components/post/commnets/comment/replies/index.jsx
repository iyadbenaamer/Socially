import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Reply from "./reply";
import AddComment from "components/post/AddComment";

import axiosClient from "utils/AxiosClient";
import { PostContext } from "components/post";
import { useSelector } from "react-redux";

export const RepliesContext = createContext();

const Replies = (props) => {
  const {
    commentId,
    count,
    showReplies,
    setRepliesCount,
    isSearchReplyRendered,
    setIsSearchReplyRendered,
  } = props;
  const [searchParams] = useSearchParams();
  const post = useContext(PostContext);
  const myProfile = useSelector((state) => state.profile);
  const replyId = searchParams.get("replyId");
  const dialog = searchParams.get("dialog");

  const [replies, setReplies] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchReplies = () => {
    if (!showReplies) return;
    setLoading(true);
    const res = axiosClient(
      `reply/page?postId=${post._id}&commentId=${commentId}&cursor=${cursor}`,
    );
    res
      .then((response) => {
        if (response.status === 200) {
          setReplies((prev) => [...prev, ...response.data]);
          setError(false);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(fetchReplies, [cursor, showReplies]);

  useEffect(() => {
    // setIsSearchReplyRendered((prev) => !prev);
    if (!replyId || isSearchReplyRendered || !showReplies) return;

    if (replies?.length > 0) {
      // check if the searched reply is renderd, if not then the reply is fetched and rendered
      const exists = replies.find((reply) => reply._id === replyId);
      if (!exists) {
        axiosClient(
          `reply?postId=${post._id}&commentId=${commentId}&replyId=${replyId}`,
        )
          .then((response) => {
            if (response.status === 200) {
              setReplies((prev) => [...prev, response.data]);
            }
          })
          .catch(() => {});
      }
    }
  }, [replies]);

  const focusedReply = useRef();

  useEffect(() => {
    if (focusedReply.current && !isSearchReplyRendered && !dialog) {
      window.scrollTo({ top: focusedReply.current.offsetTop - 200 });
      setIsSearchReplyRendered(true);
    }
  }, [replies, dialog]);
  useEffect(() => {
    if (isSearchReplyRendered) {
      focusedReply.current?.classList?.remove("focused");
    }
  }, [showReplies]);

  if (!showReplies) return null;

  return (
    <RepliesContext.Provider value={{ replies, setReplies }}>
      <div className="flex flex-col gap-3 mt-4">
        {replies.map((reply) => (
          <div
            key={reply._id}
            id={reply._id}
            className={reply._id === replyId && !dialog ? "focused" : null}
            ref={reply._id === replyId ? focusedReply : null}
          >
            <Reply key={reply._id} reply={reply} />
          </div>
        ))}
        {replies?.length < count && !loading && !error && (
          <button
            className="text-left transition hover:text-[var(--primary-color)] hover:underline underline-offset-2 z-20"
            onClick={() => setCursor(replies[replies.length - 1]?.createdAt)}
          >
            show more
          </button>
        )}

        {loading && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3 w-full pb-3">
                <div className="h-12 w-12 rounded-full bg-alt" />
                <div className="flex-1 flex flex-col gap-2 pt-1">
                  <div className="h-16 w-2/3 rounded-xl bg-alt" />
                </div>
              </div>
            ))}
          </div>
        )}
        {error && (
          <div className="w-full text-center text-slate-400 text-sm my-4">
            Faild to view replies.
            <span className="link cursor-pointer" onClick={fetchReplies}>
              Try again
            </span>
          </div>
        )}
        {(!post.isCommentsDisabled || myProfile?._id === post.creatorId) &&
          myProfile && (
            <AddComment
              type="reply"
              commentId={commentId}
              setReplies={setReplies}
              setRepliesCount={setRepliesCount}
            />
          )}
      </div>
    </RepliesContext.Provider>
  );
};

export default Replies;
