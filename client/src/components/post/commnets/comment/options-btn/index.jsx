import { useContext, useRef, useState } from "react";
import { useSelector } from "react-redux";

import Delete from "./Delete";
import Edit from "./Edit";
import CopyLink from "./CopyLink";

import { PostContext } from "components/post";
import useCloseWidget from "hooks/useCloseWidget";

import { ReactComponent as MoreIcon } from "assets/icons/more.svg";

const OptionsBtn = ({ commentId, commentCreatorId, setIsModifying }) => {
  // Get current user ID from Redux store
  const profileId = useSelector((state) => state.profile)?._id;

  // Get current theme (dark/light) from Redux store
  const theme = useSelector((state) => state.settings.theme);

  // Whether the options menu is open
  const [isOpen, setIsOpen] = useState(false);

  // Post context provides the current post's data
  const post = useContext(PostContext);

  // Ref to detect outside clicks and close the menu
  const optionsListRef = useRef(null);

  // Hook to close the widget when clicked outside
  useCloseWidget(optionsListRef, setIsOpen);

  // Determine if the current user is the comment owner
  const isOwner = profileId === commentCreatorId;

  // Determine if the current user is the post creator (moderation rights)
  const isPostCreator = profileId === post.creatorId;

  // Theme-based class for hover/focus on the button
  const buttonThemeClass =
    theme === "dark"
      ? "hover:bg-[#303343] focus:bg-[#303343]"
      : "hover:bg-[#eaedfb] focus:bg-[#eaedfb]";

  // Icon color based on theme
  const iconFill = theme === "dark" ? "#c3c5cd" : "#5b5d67";

  // Menu background color based on theme
  const menuBg = theme === "dark" ? "bg-300" : "bg-100";

  return (
    <div ref={optionsListRef} className="relative">
      {/* Button to toggle the options menu */}
      <button
        aria-label="comment options"
        className={`aspect-square w-7 p-1 flex justify-center items-center icon transition cursor-pointer ${buttonThemeClass}`}
        style={{ borderRadius: "50%" }}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <MoreIcon style={{ fill: iconFill }} />
      </button>

      {/* Options menu */}
      {isOpen && (
        <ul
          className={`menu absolute top-full right-0 rounded-xl w-max overflow-hidden z-20 ${menuBg}`}
        >
          <div onClick={() => setIsOpen(false)}>
            {/* Show Delete if the user owns the comment or is post creator */}
            {(isOwner || isPostCreator) && <Delete commentId={commentId} />}

            {/* Show Edit only if the user owns the comment */}
            {isOwner && <Edit setIsModifying={setIsModifying} />}

            {/* Show CopyLink for all users */}
            <CopyLink commentPath={`_id=${post._id}&commentId=${commentId}`} />
          </div>
        </ul>
      )}
    </div>
  );
};

export default OptionsBtn;
