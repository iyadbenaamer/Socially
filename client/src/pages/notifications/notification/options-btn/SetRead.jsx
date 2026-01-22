import { useDispatch } from "react-redux";

import { setNotificationIsRead } from "state";
import axiosClient from "utils/AxiosClient";

import EyeIcon from "assets/icons/eye.svg?react";

const SetRead = (props) => {
  const { id } = props;

  const dispatch = useDispatch();

  const deleteMessage = async () => {
    await axiosClient
      .patch(`notifications/set_read/${id}`)
      .catch(() => {})
      .finally(() => dispatch(setNotificationIsRead(id)));
  };

  return (
    <li>
      <button
        className="flex gap-2 p-3 bg-hovered w-full"
        onClick={deleteMessage}
      >
        <span className="w-6">
          <EyeIcon />
        </span>
        Mark as read
      </button>
    </li>
  );
};

export default SetRead;
