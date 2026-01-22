import TrashIcon from "assets/icons/copy.svg?react";

const CopyLink = (props) => {
  const { commentPath } = props;
  const copyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.host}/post?${commentPath}`,
    );
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
        Copy the comment link
      </button>
    </li>
  );
};

export default CopyLink;
