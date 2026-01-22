import { useContext } from "react";

import { PostContext } from "..";
import convertToUnit from "utils/convertToUnit";

import ViewsIcon from "assets/icons/eye.svg?react";

const Views = () => {
  const { views } = useContext(PostContext);

  return (
    <div className="flex items-center gap-1 mx-">
      <span className="text-xs">{convertToUnit(views)}</span>
      <div className="w-4">
        <ViewsIcon />
      </div>
    </div>
  );
};

export default Views;
