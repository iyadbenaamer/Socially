import { createContext, useContext, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Replies from "./replies";
import OptionsBtn from "./options-btn";
import Media from "./Media";

import Like from "./Like";
import UserPicture from "components/UserPicture";
import Text from "components/Text";

import { PostContext } from "components/post";
import useGetTime from "hooks/useGetTime";
import convertToUnit from "utils/convertToUnit";

import CommentIcon from "assets/icons/comments.svg?react";
import HoverWrapper from "components/user-hover-card/HoverWrapper";
import { useSelector } from "react-redux";

export const CommentContext = createContext();

const Comment = (props) => {
  const {
    comment: {
      _id: id,
      createdAt,
      creatorId,
      isLiked,
      profile,
      file,
      text,
      likesCount,
    },
  } = props;
  const [searchParams] = useSearchParams();
  const replyIdParam = searchParams.get("replyId");
  const commentIdParam = searchParams.get("commentId");

  const post = useContext(PostContext);

  const [repliesCount, setRepliesCount] = useState(props.comment.repliesCount);
  const [isModifying, setIsModifying] = useState(false);
  const [isSearchReplyRendered, setIsSearchReplyRendered] = useState(false);

  const [showReplies, setShowReplies] = useState(
    Boolean(replyIdParam) && commentIdParam === id,
  );
  const time = useGetTime(createdAt);
  if (!(props.comment && profile)) return null;

  return (
    <CommentContext.Provider value={{ setRepliesCount }}>
      <div className="flex flex-col gap-2 rounded-xl items-start justify-start">
        <div className="flex items-center gap-2">
          <div className="flex gap-2 items-start">
            <div className="w-10 sm:w-12">
              <UserPicture profile={profile} />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`${
                        text
                          ? "bg-300 rounded-2xl shadow-md px-3 py-2"
                          : "min-w-36"
                      } max-w-[240px] sm:max-w-sm lg:max-w-md`}
                    >
                      <HoverWrapper profile={profile}>
                        <Link
                          to={`/profile/${profile.username}`}
                          className="hover:underline"
                        >
                          {profile.firstName} {profile.lastName}
                        </Link>
                      </HoverWrapper>
                      <Text
                        postCreatorId={post.creatorId}
                        text={text}
                        type="comment"
                        postId={post._id}
                        commentId={id}
                        isModifying={isModifying}
                        setIsModifying={setIsModifying}
                      />
                    </div>
                    <OptionsBtn
                      commentId={id}
                      commentCreatorId={creatorId}
                      setIsModifying={setIsModifying}
                      id={id}
                    />
                  </div>
                  <Media>
                    <div className="rounded-xl overflow-hidden max-w-80">
                      {file && file.fileType === "photo" && (
                        <img src={file.path} alt="" />
                      )}
                      {file && file.fileType === "video" && (
                        <video controls src={file.path} />
                      )}
                    </div>
                  </Media>
                </div>
              </div>
              <div className="flex gap-3 items-center justify-start">
                <Like
                  isLiked={isLiked}
                  likesCount={likesCount}
                  userId={post.creatorId}
                  postId={post._id}
                  commentId={id}
                />
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="flex items-center gap-1 text-hovered transition text-slate-400"
                >
                  <CommentIcon width={16} />
                  {convertToUnit(repliesCount)}
                </button>
                <span className="block text-xs text-slate-400">{time}</span>
              </div>
              <div className="-ms-5">
                <Replies
                  isSearchReplyRendered={isSearchReplyRendered}
                  setIsSearchReplyRendered={setIsSearchReplyRendered}
                  setRepliesCount={setRepliesCount}
                  showReplies={showReplies}
                  commentId={id}
                  count={repliesCount}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </CommentContext.Provider>
  );
};

export default Comment;
