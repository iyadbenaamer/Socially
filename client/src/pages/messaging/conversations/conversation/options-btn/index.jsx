import { useRef, useState } from "react";
import { useSelector } from "react-redux";

import useCloseWidget from "hooks/useCloseWidget";

import MoreIcon from "assets/icons/more.svg?react";
import Delete from "./Delete";
import Clear from "./Clear";

const OptionsBtn = ({ conversationId }) => {
  // Get current theme (light/dark) from Redux
  const theme = useSelector((state) => state.settings.theme);

  // State to toggle options menu visibility
  const [isOpen, setIsOpen] = useState(false);

  // Ref to the options container (used for outside click detection)
  const optionsList = useRef(null);

  // Closes menu if clicked outside the component
  useCloseWidget(optionsList, setIsOpen);

  const iconFill = theme === "dark" ? "#c3c5cd" : "#5b5d67";
  const menuBg = theme === "dark" ? "bg-300" : "bg-100";

  return (
    <div ref={optionsList} className="relative">
      {/* Button to toggle the dropdown menu */}
      <button
        aria-label="post options"
        className={`aspect-square p-1 flex justify-center items-center icon transition cursor-pointer`}
        style={{ borderRadius: "50%" }}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <MoreIcon style={{ fill: iconFill }} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <ul
          className={`absolute top-full right-0 rounded-xl w-max overflow-hidden z-10 ${menuBg}`}
        >
          <li onClick={() => setIsOpen(false)}>
            <Delete conversationId={conversationId} />
          </li>
          <li onClick={() => setIsOpen(false)}>
            <Clear conversationId={conversationId} />
          </li>
        </ul>
      )}
    </div>
  );
};

export default OptionsBtn;
