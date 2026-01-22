import { useContext } from "react";
import { useDispatch } from "react-redux";

import RedBtn from "components/RedBtn";
import PrimaryBtn from "components/PrimaryBtn";
import CheckBox from "components/CheckBox";

import axiosClient from "utils/AxiosClient";
import { setShowMessage } from "state";
import { useDialog } from "components/dialog/DialogContext";
import { ConversationContext } from "..";

import BrushIcon from "assets/icons/brush.svg?react";

const Clear = ({ conversationId }) => {
  const { openDialog, closeDialog } = useDialog();
  const { participant } = useContext(ConversationContext);
  let forEveryone = false;

  const dispatch = useDispatch();

  const clearConversation = async () => {
    await axiosClient
      .patch(
        `conversation/clear?conversationId=${conversationId}&forEveryone=${forEveryone}`,
      )
      .then(() => {
        document.body.style = null;
        closeDialog();

        dispatch(
          setShowMessage({ message: "Conversation cleared.", type: "info" }),
        );
      });
  };

  const handleClearClick = () => {
    openDialog(
      <div className="p-2">
        <div className="w-full py-4">
          <p>Are you sure you want to clear this conversation?</p>
          <div className="flex gap-2 mt-4 ms-2 text-sm">
            <CheckBox
              onCheck={(checked) => {
                forEveryone = checked;
              }}
            />
            <span>Also clear for {participant.firstName}</span>
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <PrimaryBtn onClick={closeDialog}>Cancel</PrimaryBtn>
          <RedBtn onClick={clearConversation}>Clear</RedBtn>
        </div>
      </div>,
    );
  };

  return (
    <li>
      <button
        className="flex gap-2 p-3 bg-hovered w-full"
        onClick={handleClearClick}
      >
        <span className="w-6">
          <BrushIcon />
        </span>
        Clear the conversation
      </button>
    </li>
  );
};

export default Clear;
