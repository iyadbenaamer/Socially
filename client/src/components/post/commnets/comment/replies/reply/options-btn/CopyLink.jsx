import TrashIcon from "assets/icons/copy.svg?react";

const CopyLink = (props) => {
  const { replyPath } = props;
  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.host}/post?${replyPath}`);
  };
  return (
    <li>
      <button
        className="flex w-full gap-2 p-3 bg-hovered"
        onClick={() => copyLink()}
      >
        <span className="w-6">
          <TrashIcon />
        </span>
        Copy the reply link
      </button>
    </li>
  );
};

export default CopyLink;
