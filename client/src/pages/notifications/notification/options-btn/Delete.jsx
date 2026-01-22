import { useDispatch } from "react-redux";

import axiosClient from "utils/AxiosClient";
import { removeNotification, setShowMessage } from "state";

import TrashIcon from "assets/icons/trash-basket.svg?react";

const Delete = (props) => {
  const { id } = props;

  const dispatch = useDispatch();

  const deleteMessage = async () => {
    await axiosClient
      .delete(`notifications/delete/${id}`)
      .then(() => {
        dispatch(removeNotification(id));
        dispatch(
          setShowMessage({
            message: "Notification deleted.",
            type: "info",
          }),
        );
      })
      .catch((err) => {
        if (err.response) {
          dispatch(removeNotification(id));
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
        className="flex gap-2 p-3 bg-hovered w-full"
        onClick={deleteMessage}
      >
        <span className="w-6">
          <TrashIcon />
        </span>
        Delete
      </button>
    </li>
  );
};

export default Delete;
