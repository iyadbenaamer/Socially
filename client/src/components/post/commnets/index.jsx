import { useContext, useRef, useState } from "react";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Comment from "./comment";

import { PostContext } from "..";

import axiosClient from "utils/AxiosClient";

const Comments = () => {
  const context = useContext(PostContext);
  const { _id: postId, comments, setComments, commentsCount } = context;
  const [searchParams] = useSearchParams();

  const commentId = searchParams.get("commentId");
  const replyId = searchParams.get("replyId");
  const dialog = searchParams.get("dialog");

  const [cursor, setCursor] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const focusedComment = useRef();

  const fetchComments = () => {
    // if (loading) return;
    setLoading(true);
    axiosClient(`comment/page?postId=${postId}&cursor=${cursor}`)
      .then((response) => {
        if (response.status === 200) {
          setComments((prev) => [...prev, ...response.data]);
          setError(false);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(fetchComments, [cursor]);

  useEffect(() => {
    if (!commentId) return;

    if (comments?.length > 0) {
      const exists = comments.find((comment) => comment._id === commentId);
      if (!exists && commentId) {
        axiosClient(`comment?postId=${postId}&commentId=${commentId}`)
          .then((response) => {
            if (response.status === 200) {
              setComments((prev) => [...prev, response.data]);
            }
          })
          .catch(() => {});
      }
    }
  }, [comments]);

  useEffect(() => {
    if (commentId && !replyId && !dialog) {
      window.scrollTo({ top: focusedComment.current?.offsetTop - 200 });
    }
  }, [focusedComment.current, commentId, replyId, comments, dialog]);

  return (
    <div className={`flex flex-col gap-5 w-full`}>
      {comments.length > 0 && (
        <>
          {comments.map((comment) => (
            <div
              key={comment._id}
              className={
                commentId === comment._id && !replyId && !dialog
                  ? "focused"
                  : null
              }
              ref={comment._id === commentId ? focusedComment : null}
              id={comment._id}
            >
              <Comment postId={postId} key={comment._id} comment={comment} />
            </div>
          ))}
          {!loading && comments?.length < commentsCount && (
            <button
              className="text-left transition hover:text-[var(--primary-color)] hover:underline underline-offset-2"
              onClick={() => {
                setCursor(comments[comments.length - 1]?.createdAt);
              }}
            >
              show more
            </button>
          )}
        </>
      )}
      {loading && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse flex gap-3 w-full pb-3">
              <div className="h-12 w-12 rounded-full bg-alt" />
              <div className="flex-1 flex flex-col gap-2 pt-1">
                <div className="h-16 w-1/3 rounded-xl bg-alt" />
              </div>
            </div>
          ))}
        </div>
      )}
      {comments?.length === 0 && !error && !loading && (
        <div className="w-full text-center text-slate-400 text-sm my-4">
          No comments.
        </div>
      )}
      {error && !loading && (
        <div className="w-full text-center text-slate-400 text-sm my-4">
          Faild to view comments.{" "}
          <Link className="link " onClick={fetchComments}>
            Try again
          </Link>
        </div>
      )}
    </div>
  );
};

export default Comments;
