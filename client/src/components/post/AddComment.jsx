import { useContext, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import UserPicture from "components/UserPicture";
import { PostContext } from ".";

import axiosClient from "utils/AxiosClient";

import PhotoIcon from "assets/icons/photo.svg?react";
import AddCommentIcon from "assets/icons/create-comment.svg?react";
import CloseIcon from "assets/icons/cross.svg?react";
import { setShowMessage } from "state";

const AddComment = (props) => {
  const { type, commentId, setReplies, setRepliesCount } = props;
  const {
    _id: postId,
    creatorId,
    setPost,
    setComments,
    commentInput,
    setIsCommentsDisabled,
  } = useContext(PostContext);
  const profile = useSelector((state) => state.profile);

  const [text, setText] = useState("");
  const [media, setMedia] = useState(null);

  const dispatch = useDispatch();
  const mediaBtn = useRef(null);

  const addComment = () => {
    const formData = new FormData();
    formData.append("text", text.trim());
    media && formData.append("media", media);
    const requestUrl =
      type === "comment"
        ? `comment/add?userId=${creatorId}&postId=${postId}`
        : `reply/add?userId=${creatorId}&postId=${postId}&commentId=${commentId}`;
    axiosClient
      .post(requestUrl, formData)
      .then((response) => {
        if (type === "comment") {
          setPost((prev) => ({
            ...prev,
            commentsCount: prev.commentsCount + 1,
          }));
          setComments((prev) => [...prev, response.data]);
        }
        if (type === "reply") {
          setReplies((prev) => [...prev, response.data]);
          setRepliesCount((prev) => prev + 1);
        }
      })
      .catch((err) => {
        if (err.response) {
          dispatch(
            setShowMessage({
              message: err.response.data?.message,
              type: "error",
            }),
          );
          setIsCommentsDisabled(true);
        } else {
          dispatch(
            setShowMessage({
              message: "An error occurred. Please try again later.",
              type: "error",
            }),
          );
        }
      });
  };
  useEffect(() => {
    if (commentInput.current) {
      commentInput.current.focus();
    }
  }, [commentInput]);

  const [file, setFile] = useState(null);

  return (
    <div className="w-full py-3">
      <div className={`flex gap-2 ${media ? "items-start" : "items-center"}`}>
        <span className="w-12">
          <UserPicture profile={profile} />
        </span>
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-2 bg-300 py-2 px-2 rounded-xl shadow-md">
            <textarea
              ref={commentInput}
              onKeyDown={(e) => {
                if (text) {
                  if (e.key === "Enter" && !e.ctrlKey) {
                    addComment();
                    setMedia(null);
                    setFile(null);
                    setText("");
                  } else if (e.key === "Enter") {
                    e.target.value += "\n";
                  }
                }
              }}
              value={text}
              dir="auto"
              className="comment-input h-6 w-4/5"
              placeholder={
                type === "reply" ? "Write a reply" : "Write a comment"
              }
              onChange={(e) => {
                if (e.target.value.length <= 10000) {
                  setText(e.target.value);
                }
              }}
            ></textarea>
            <div className="flex justify-end w-1/5">
              <input
                accept="video/*, video/x-m4v, video/webm, video/x-ms-wmv, video/x-msvideo, video/3gpp, video/flv, video/x-flv, video/mp4, video/quicktime, video/mpeg, video/ogv, .ts, .mkv, image/*, image/heic, image/heif"
                style={{ display: "none" }}
                type="file"
                ref={mediaBtn}
                onChange={(e) => {
                  const reader = new FileReader();
                  if (e.target.files[0]) {
                    reader.readAsDataURL(e.target.files[0]);
                    reader.addEventListener("load", (e) =>
                      setFile(e.currentTarget.result),
                    );
                    setMedia(e.target.files[0]);
                  }
                }}
              />
              <button
                aria-label="add a photo or a video"
                className="w-7  circle p-[2px] outline-none text-hovered transition focus:[text-hovered]"
                onClick={() => mediaBtn.current.click()}
              >
                <PhotoIcon />
              </button>
              <button
                aria-label="send the comment"
                disabled={!(text || media)}
                className={`w-8 text-white stroke-white p-1 ${
                  !(text || media) ? "icon opacity-30" : "icon-hover"
                }`}
                onClick={() => {
                  addComment();
                  setMedia(null);
                  setFile(null);
                  setText("");
                }}
              >
                <AddCommentIcon />
              </button>
            </div>
          </div>
          {file && (
            <div className="w-32">
              <button
                className="w-5"
                onClick={() => {
                  setMedia(null);
                  setFile(null);
                }}
              >
                <CloseIcon />
              </button>
              <div className="rounded-xl overflow-hidden">
                {media.type.startsWith("image") ? (
                  <img src={file} />
                ) : (
                  <video src={file} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddComment;
