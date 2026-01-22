import OptionsBtn from "./options-btn";
import Time from "components/time";

import SingleTickIcon from "assets/icons/single-tick.svg?react";
import DoubleTickIcon from "assets/icons/double-tick.svg?react";

const MyMessage = (props) => {
  const { _id: id, text, info, createdAt } = props.message;
  return (
    <div className="w-full flex justify-end gap-2">
      <OptionsBtn id={id} />
      <div className="bg-[#5b6ecd] pe-2 pb-1 flex flex-col text-white rounded-xl min-w-[100px] shadow-md max-w-[80%] sm:max-w-[60%]">
        <div className="px-2 pt-1 -mb-1 text-wrap text-ellipsis overflow-clip">
          {text}
        </div>
        <div className="self-end flex items-center">
          {info.deliveredTo.length === 1 && <SingleTickIcon />}
          {info.deliveredTo.length === 2 && (
            <DoubleTickIcon
              strokeWidth={0}
              className={
                info.readBy.length === 2 ? "text-[#434eee]" : "text-[white]"
              }
            />
          )}
          <Time withDate={false} date={createdAt} />
        </div>
      </div>
    </div>
  );
};

export default MyMessage;
