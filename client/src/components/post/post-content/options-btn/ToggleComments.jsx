import { useContext } from "react";
import { useDispatch, useSelector } from "react-redux";

import { PostContext } from "components/post";

import axiosClient from "utils/AxiosClient";

import CommentsEnabledIcon from "assets/icons/comments.svg?react";
import CommentsDisabledIcon from "assets/icons/comments-turnedoff.svg?react";
import { setShowMessage } from "state";

const ToggleComments = () => {
  const {
    _id: postId,
    creatorId: id,
    isCommentsDisabled,
    setIsCommentsDisabled,
  } = useContext(PostContext);

  const dispatch = useDispatch();

  const toggleComments = () => {
    axiosClient
      .patch(`/post/toggle_comments?userId=${id}&postId=${postId}`)
      .then((response) => {
        setIsCommentsDisabled((prev) => !prev);
        dispatch(
          setShowMessage({ message: response.data.message, type: "info" }),
        );
      })
      .catch((err) => {
        if (err.response) {
          dispatch(
            setShowMessage({
              message: err.response.data.message,
              type: "error",
            }),
          );
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
  return (
    <li>
      <button
        className="flex w-full gap-2 p-3 bg-hovered"
        onClick={() => toggleComments()}
      >
        <span className="w-6 ">
          {isCommentsDisabled ? (
            <CommentsEnabledIcon />
          ) : (
            <CommentsDisabledIcon />
          )}
        </span>
        {isCommentsDisabled ? "Turn on comments" : "Turn off comments"}
      </button>
    </li>
  );
};

export default ToggleComments;
