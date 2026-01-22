import { useSelector } from "react-redux";

import OptionsBtn from "./options-btn";
import Status from "./Status";
import Time from "components/time";

const OthersMessage = (props) => {
  const { _id: id, text, info, createdAt } = props.message;
  const theme = useSelector((state) => state.settings.theme);
  const colors = theme === "dark" ? "bg-200 text-white" : "bg-100";
  return (
    <div className="w-full flex justify-start gap-2">
      <div
        className={`${colors} flex flex-col rounded-xl shadow-md min-w-[100px] max-w-[80%] sm:max-w-[60%]`}
      >
        <div className="px-2 pt-1 -mb-1 text-wrap text-ellipsis overflow-clip">
          {text}
        </div>
        <div className="self-end flex items-center">
          <Time withDate={false} date={createdAt} />
          <Status info={info} />
        </div>
      </div>
      <OptionsBtn id={id} />
    </div>
  );
};

export default OthersMessage;
