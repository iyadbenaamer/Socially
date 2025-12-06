import { useSelector } from "react-redux";

import Slider from "./slider";
import CreatorInfo from "./post/post-content/CreatorInfo";
import Text from "./Text";

const SharedPost = (props) => {
  const {
    _id: id,
    profile,
    isDeleted,
    text,
    files,
    createdAt,
    location,
  } = props.post;
  const theme = useSelector((state) => state.settings.theme);

  return (
    <div
      className={`shared-post flex flex-col bg-200 w-full my-2 py-2 ${
        theme === "light" ? "border" : ""
      }`}
    >
      {id && (
        <div className="scale-95 opacity-100 z-10">
          <div className="flex justify-between px-2">
            <CreatorInfo
              profile={profile}
              createdAt={createdAt}
              location={location}
              postId={id}
            />
          </div>
          <div className="px-1 py-3 sm:px-4 flex flex-col gap-3">
            <Text text={text} type="post" />
          </div>
          {files?.length > 0 && <Slider files={files} />}
        </div>
      )}
      {isDeleted && (
        <div className="bg-100 p-4 rounded-md m-1">
          This content is not available.
        </div>
      )}
    </div>
  );
};

export default SharedPost;
