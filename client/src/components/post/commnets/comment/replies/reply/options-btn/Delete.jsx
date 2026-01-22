import { useDispatch } from "react-redux";
import { useContext } from "react";

import RedBtn from "components/RedBtn";
import PrimaryBtn from "components/PrimaryBtn";
import { PostContext } from "components/post";
import { useDialog } from "components/dialog/DialogContext";

import { setShowMessage } from "state";
import axiosClient from "utils/AxiosClient";
import { RepliesContext } from "../..";
import { CommentContext } from "../../..";

import TrashIcon from "assets/icons/trash-basket.svg?react";

const Delete = ({ commentId, replyId }) => {
  const { _id: postId, creatorId } = useContext(PostContext);
  const { setReplies } = useContext(RepliesContext);
  const { setRepliesCount } = useContext(CommentContext);
  const { openDialog, closeDialog } = useDialog();
  const dispatch = useDispatch();

  const deleteReply = async () => {
    await axiosClient
      .delete(
        `reply/delete?userId=${creatorId}&postId=${postId}&commentId=${commentId}&replyId=${replyId}`,
      )
      .then(() => {
        setReplies((prev) => prev.filter((reply) => reply._id !== replyId));
        setRepliesCount((prev) => prev - 1);
        dispatch(setShowMessage({ message: "Reply deleted.", type: "info" }));
      })
      .catch((err) => {
        if (err.response) {
          setReplies((prev) => prev.filter((reply) => reply._id !== replyId));
          setRepliesCount((prev) => prev - 1);
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
      })
      .finally(() => {
        document.body.style = null;
        closeDialog();
      });
  };

  const handleDeleteClick = () => {
    openDialog(
      <div className="p-2">
        <div className="w-full py-4">
          Are you sure you want to delete this reply?
        </div>
        <div className="flex justify-between mt-2">
          <PrimaryBtn onClick={closeDialog}>Cancel</PrimaryBtn>
          <RedBtn onClick={deleteReply}>Delete</RedBtn>
        </div>
      </div>,
    );
  };

  return (
    <li>
      <button
        className="flex gap-2 p-3 bg-hovered w-full"
        onClick={handleDeleteClick}
      >
        <span className="w-6">
          <TrashIcon />
        </span>
        Delete the reply
      </button>
    </li>
  );
};

export default Delete;
