import { useDispatch } from "react-redux";

import RedBtn from "components/RedBtn";
import PrimaryBtn from "components/PrimaryBtn";

import axiosClient from "utils/AxiosClient";
import { setShowMessage } from "state";
import { useDialog } from "components/dialog/DialogContext";

import TrashIcon from "assets/icons/trash-basket.svg?react";

const Delete = ({ conversationId }) => {
  const { openDialog, closeDialog } = useDialog();

  const dispatch = useDispatch();

  const deleteConversation = async () => {
    await axiosClient
      .delete(`conversation/delete?conversationId=${conversationId}`)
      .then(() => {
        document.body.style = null;
        closeDialog();
        dispatch(
          setShowMessage({ message: "Conversation deleted.", type: "info" }),
        );
      });
  };

  const handleDeleteClick = () => {
    openDialog(
      <div className="p-2">
        <div className="w-full py-4 ">
          Are you sure you want to delete this conversation?
        </div>
        <div className="flex justify-between mt-2">
          <PrimaryBtn onClick={closeDialog}>Cancel</PrimaryBtn>
          <RedBtn onClick={deleteConversation}>Delete</RedBtn>
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
        Delete the conversation
      </button>
    </li>
  );
};

export default Delete;
