import { useDispatch } from "react-redux";
import { useContext } from "react";

import RedBtn from "components/RedBtn";
import PrimaryBtn from "components/PrimaryBtn";
import { PostContext } from "components/post";
import { useDialog } from "components/dialog/DialogContext";

import axiosClient from "utils/AxiosClient";
import { setShowMessage } from "state";

import TrashIcon from "assets/icons/trash-basket.svg?react";

const Delete = ({ commentId }) => {
  const { _id: postId, creatorId } = useContext(PostContext);
  const { openDialog, closeDialog } = useDialog();

  const dispatch = useDispatch();
  const { setComments, setPost } = useContext(PostContext);

  const deleteComment = async () => {
    await axiosClient
      .delete(
        `comment/delete?userId=${creatorId}&postId=${postId}&commentId=${commentId}`,
      )
      .then(() => {
        setComments((prev) =>
          prev.filter((comment) => comment._id !== commentId),
        );
        setPost((prev) => ({
          ...prev,
          commentsCount: prev.commentsCount - 1,
        }));
        dispatch(
          setShowMessage({ message: "Comment is deleted.", type: "info" }),
        );
      })
      .catch((err) => {
        if (err.response) {
          setPost((prev) => ({
            ...prev,
            commentsCount: prev.commentsCount - 1,
          }));
          setComments((prev) =>
            prev.filter((comment) => comment._id !== commentId),
          );
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
          Are you sure you want to delete this comment?
        </div>
        <div className="flex justify-between mt-2">
          <PrimaryBtn onClick={closeDialog}>Cancel</PrimaryBtn>
          <RedBtn onClick={deleteComment}>Delete</RedBtn>
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
        Delete the comment
      </button>
    </li>
  );
};

export default Delete;
