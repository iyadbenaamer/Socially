import { createContext, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import Comments from "./commnets";
import PostContent from "./post-content";
import ReactionsBar from "./reactions-bar";
import AddComment from "./AddComment";
import SharedPost from "components/SharedPost";

import axiosClient from "utils/AxiosClient";

import "./index.css";

export const PostContext = createContext();

export const Post = (props) => {
  const { creatorId } = props.post;
  const [post, setPost] = useState(props.post);
  const [isCommentsDisabled, setIsCommentsDisabled] = useState(
    props.post.isCommentsDisabled
  );
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(props.showComments);

  const profile = useSelector((state) => state.profile);
  const theme = useSelector((state) => state.settings.theme);

  const commentInput = useRef();

  useEffect(() => {
    if (!post.isViewed && profile && profile._id !== post.creatorId) {
      axiosClient
        .patch("/post/set-viewed?postId=" + post._id)
        .catch((err) => {});
    }
  }, [post._id, post.creatorId, post.isViewed, profile]);

  if (!post) return null;

  return (
    <PostContext.Provider
      value={{
        ...post,
        setPost,
        comments,
        setComments,
        setShowComments,
        commentInput,
        setIsCommentsDisabled,
        isCommentsDisabled,
      }}
    >
      <div
        className={`w-full bg-200 sm:rounded-xl shadow-md ${
          theme === "light" ? "border" : ""
        }`}
      >
        <div className="flex flex-col bg-200 sm:rounded-xl w-full pt-4 pb-2">
          <PostContent />
          {post.sharedPost && <SharedPost post={post.sharedPost} />}
          <ReactionsBar />
        </div>
        {showComments && (
          <div
            className={`flex flex-col gap-4 p-2 items-start ${
              theme === "dark" ? "border-t-[#ffffff0f]" : "border-t-[#0000000d]"
            } border-t`}
          >
            <Comments />
            {profile &&
              (!isCommentsDisabled || profile._id === post.creatorId) && (
                <AddComment type="comment" />
              )}
            {post.isCommentsDisabled && profile?._id !== post.creatorId && (
              <div className="text-center p-4 bg-300 sm:rounded-xl w-full">
                {profile && profile._id === creatorId
                  ? "You"
                  : "The post creator"}{" "}
                turned off the comments.
              </div>
            )}
          </div>
        )}
      </div>
    </PostContext.Provider>
  );
};

export default Post;
