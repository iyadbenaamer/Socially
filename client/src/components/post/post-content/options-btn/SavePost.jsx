import { useDispatch } from "react-redux";

import { setShowMessage } from "state";

import axiosClient from "utils/AxiosClient";

import SaveIcon from "assets/icons/save.svg?react";
import UnsaveIcon from "assets/icons/unsave.svg?react";

const SavePost = (props) => {
  const { id, isSaved, setIsSaved } = props;

  const dispatch = useDispatch();

  const savePost = () => {
    axiosClient
      .patch(`toggle_save_post?id=${id}`)
      .then(() => {
        if (!isSaved) {
          dispatch(setShowMessage({ message: "Post saved.", type: "info" }));
        } else {
          dispatch(setShowMessage({ message: "Post unsaved.", type: "info" }));
        }
        setIsSaved((prev) => !prev);
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
        onClick={() => savePost()}
      >
        {isSaved === false && (
          <>
            <span className="w-6">
              <SaveIcon />
            </span>
            Save the post
          </>
        )}
        {isSaved === true && (
          <>
            <span className="w-6">
              <UnsaveIcon />
            </span>
            Unsave the post
          </>
        )}
      </button>
    </li>
  );
};

export default SavePost;
