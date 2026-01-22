import { useContext, useRef, useState } from "react";
import { useSelector } from "react-redux";

import Delete from "./Delete";

import useCloseWidget from "hooks/useCloseWidget";

import MoreIcon from "assets/icons/more.svg?react";

const OptionsBtn = (props) => {
  const { id } = props;
  const theme = useSelector((state) => state.settings.theme);
  const [isOpen, setIsOpen] = useState(false);
  const optionsList = useRef(null);

  useCloseWidget(optionsList, setIsOpen);

  return (
    <div
      ref={optionsList}
      className="relative flex items-center h-fit self-center"
      onClick={() => setIsOpen((prev) => !prev)}
    >
      <button
        aria-label="comment options"
        className={`aspect-square w-5 flex justify-center ${
          theme === "dark"
            ? "hover:bg-[#303343] focus:bg-[#303343]"
            : "hover:bg-[#eaedfb] focus:bg-[#eaedfb]"
        } items-center icon transition cursor-pointer `}
        style={{ borderRadius: "50%" }}
      >
        <MoreIcon style={{ fill: theme === "dark" ? "#c3c5cd" : "#5b5d67 " }} />
      </button>
      {isOpen && (
        <ul
          className={`menu absolute top-[100%] right-0 rounded-xl w-max overflow-hidden z-20 ${
            theme === "dark" ? "bg-300" : "bg-100"
          }`}
        >
          <Delete id={id} />
        </ul>
      )}
    </div>
  );
};

export default OptionsBtn;
