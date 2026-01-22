import EditIcon from "assets/icons/edit.svg?react";

const Edit = (props) => {
  const { setIsModifying } = props;

  return (
    <li>
      <button
        className="flex w-full gap-2 p-3 bg-hovered"
        onClick={() => {
          setIsModifying(true);
        }}
      >
        <span className="w-6">
          <EditIcon />
        </span>
        Edit the comment
      </button>
    </li>
  );
};

export default Edit;
