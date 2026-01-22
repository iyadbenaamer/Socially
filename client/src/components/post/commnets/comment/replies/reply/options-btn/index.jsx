import { useContext, useRef, useState } from "react";
import { useSelector } from "react-redux";

import useCloseWidget from "hooks/useCloseWidget";

import Delete from "./Delete";
import Edit from "./Edit";
import CopyLink from "./CopyLink";

import { PostContext } from "components/post";

import MoreIcon from "assets/icons/more.svg?react";

const OptionsBtn = ({ commentId, replyId, replyCreatorId, setIsModifying }) => {
  // Get current logged-in user ID from Redux store
  const profileId = useSelector((state) => state.profile)?._id;

  // Get current UI theme (dark or light)
  const theme = useSelector((state) => state.settings.theme);

  // Menu visibility state
  const [isOpen, setIsOpen] = useState(false);

  // Get current post data from context
  const post = useContext(PostContext);

  // Ref to the options menu DOM element
  const optionsListRef = useRef(null);

  // Hook to detect outside clicks and close the menu
  useCloseWidget(optionsListRef, setIsOpen);

  // Check if the current user is the owner of the reply
  const isOwner = profileId === replyCreatorId;

  // Theme-based class for button hover/focus
  const buttonThemeClasses =
    theme === "dark"
      ? "hover:bg-[#303343] focus:bg-[#303343]"
      : "hover:bg-[#eaedfb] focus:bg-[#eaedfb]";

  // Icon color based on theme
  const iconFill = theme === "dark" ? "#c3c5cd" : "#5b5d67";

  // Background color of the options menu
  const menuBg = theme === "dark" ? "bg-300" : "bg-100";

  return (
    <div ref={optionsListRef} className="relative">
      {/* Icon button to open/close the options menu */}
      <button
        aria-label="comment options"
        className={`aspect-square w-7 p-1 flex justify-center items-center icon transition cursor-pointer ${buttonThemeClasses}`}
        style={{ borderRadius: "50%" }}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <MoreIcon style={{ fill: iconFill }} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <ul
          className={`menu absolute top-full right-0 rounded-xl w-max overflow-hidden z-10 ${menuBg}`}
        >
          <div onClick={() => setIsOpen(false)}>
            {/* Show Delete and Edit if the user owns the reply */}
            {isOwner && <Delete commentId={commentId} replyId={replyId} />}
            {isOwner && <Edit setIsModifying={setIsModifying} />}

            {/* Everyone can copy the reply link */}
            <CopyLink
              replyPath={`_id=${post._id}&commentId=${commentId}&replyId=${replyId}`}
            />
          </div>
        </ul>
      )}
    </div>
  );
};

export default OptionsBtn;
