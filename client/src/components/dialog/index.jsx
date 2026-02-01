import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import HoverScrollContainer from "components/HoverScrollContainer";

import useCloseWidget from "hooks/useCloseWidget";

import CloseIcon from "assets/icons/cross.svg?react";

const Dialog = (props) => {
  const {
    isOpened,
    setIsOpened,
    children,
    preventClickOutside = false,
    title,
  } = props;
  const { pathname } = useLocation();
  const prompt = useRef(null);

  useCloseWidget(prompt, setIsOpened, preventClickOutside);

  useEffect(() => {
    if (isOpened) {
      /*
      adjust the width when the scrollbar is hidden due to the dialog only 
      in non-mobile screens and anywhere exepct in "messages" route
      */
      if (
        document.body.clientWidth > 768 &&
        !pathname.startsWith("/messages")
      ) {
        document.body.style.width = "calc(100% - 8px)";
      }
      document.body.style.height = "100svh";
      document.body.style.overflow = "hidden";
    } else {
      document.body.style = null;
    }
  }, [isOpened, pathname]);

  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === "Escape") {
        setIsOpened(false);
      }
    };

    if (isOpened) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpened, setIsOpened]);

  if (!isOpened) return null;

  return (
    <dialog
      aria-busy={true}
      className=" text-inherit w-full fixed top-0 bg-[#00000063] h-[100vh] flex items-center justify-center z-[1150]"
    >
      <section
        ref={prompt}
        className="dialog py-2 bg-200 max-h-[100vh] w-[calc(100vw-8px)] rounded-xl md:h-auto md:w-auto"
      >
        <button
          className="ms-3 cursor-pointer w-5"
          onClick={() => setIsOpened(!isOpened)}
        >
          <CloseIcon className="icon-hover hover:text-white" />
        </button>
        {title && <div className="px-3 py-2 text-xl">{title}</div>}
        <HoverScrollContainer>
          <div className="dialog max-h-[80vh] ps-2 py-2">{children}</div>
        </HoverScrollContainer>
      </section>
    </dialog>
  );
};

export default Dialog;
