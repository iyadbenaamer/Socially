import { useDispatch } from "react-redux";

import { setShowMessage } from "state";

import CopyIcon from "assets/icons/copy.svg?react";

const CopyLink = (props) => {
  const { id } = props;
  const dispatch = useDispatch();
  return (
    <>
      <li>
        <button
          className="flex w-full gap-2 p-3 bg-hovered"
          onClick={() => {
            navigator.clipboard.writeText(
              `${window.location.host}/post?_id=${id}`,
            );
            dispatch(setShowMessage({ message: "Link copied.", type: "info" }));
          }}
        >
          <span className="w-6">
            <CopyIcon />
          </span>
          Copy the post link
        </button>
      </li>
    </>
  );
};

export default CopyLink;
