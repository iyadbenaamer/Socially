import SingleTickIcon from "assets/icons/single-tick.svg?react";
import DoubleTickIcon from "assets/icons/double-tick.svg?react";

const Status = (props) => {
  const { deliveredTo, readBy } = props.info;

  return (
    <>
      {deliveredTo.length === 1 && <SingleTickIcon />}
      {deliveredTo.length === 2 && (
        <DoubleTickIcon
          strokeWidth={0}
          className={readBy.length === 2 ? "text-primary" : "text-[#464851]"}
        />
      )}
    </>
  );
};

export default Status;
