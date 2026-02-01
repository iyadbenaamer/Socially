import { useContext } from "react";

import { PostContext } from "..";
import Comments from "./Comments";
import Like from "./Like";
import Share from "./share";

const ReactionsBar = () => {
  const { _id: id, creatorId, likes, isLiked } = useContext(PostContext);

  return (
    <div className="flex flex-col mt-1">
      <div className="grid grid-cols-3 items-center justify-items-center">
        <Like
          likes={likes}
          type="post"
          userId={creatorId}
          postId={id}
          isLiked={isLiked}
        />
        <Comments />
        <Share />
      </div>
    </div>
  );
};

export default ReactionsBar;
