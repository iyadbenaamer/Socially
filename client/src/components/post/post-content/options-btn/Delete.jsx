import { useContext } from "react";
import { useLocation } from "react-router-dom";

import RedBtn from "components/RedBtn";
import PrimaryBtn from "components/PrimaryBtn";
import { PostContext } from "components/post";
import { PostsContext } from "components/posts";

import axiosClient from "utils/AxiosClient";

import TrashIcon from "assets/icons/trash-basket.svg?react";
import { useDialog } from "components/dialog/DialogContext";
import { setShowMessage } from "state";
import { useDispatch } from "react-redux";

const Delete = () => {
  const location = useLocation();
  const { _id: postId } = useContext(PostContext);
  const setPosts = useContext(PostsContext)?.setPosts;
  const { openDialog, closeDialog } = useDialog();

  const dispatch = useDispatch();

  const deletePost = async () => {
    await axiosClient
      .delete(`post/delete?postId=${postId}`)
      .then(() => {
        dispatch(setShowMessage({ message: "Post is deleted.", type: "info" }));
        if (location.pathname.startsWith("/post")) {
          window.history.back();
        } else {
          setPosts((prev) => prev?.filter((post) => post._id !== postId));
        }
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
      })
      .finally(() => {
        document.body.style = null;
        closeDialog();
      });
  };

  const handleDeleteClick = () => {
    openDialog(
      <div className="p-2">
        <div className="w-full py-4 ">
          Are you sure you want to delete this post?
        </div>
        <div className="flex justify-between mt-2">
          <PrimaryBtn onClick={closeDialog}>Cancel</PrimaryBtn>
          <RedBtn onClick={deletePost}>Delete</RedBtn>
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
        Delete the post
      </button>
    </li>
  );
};

export default Delete;
