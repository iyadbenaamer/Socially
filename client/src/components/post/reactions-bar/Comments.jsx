import { useContext } from "react";

import { PostContext } from "..";
import { useWindowWidth } from "hooks/useWindowWidth";

import convertToUnit from "utils/convertToUnit";

import CommentIcon from "assets/icons/comments.svg?react";

const Comments = () => {
  const { commentsCount, setShowComments, commentInput } =
    useContext(PostContext);

  const windowWidth = useWindowWidth();

  return (
    <div className="flex w-auto justify-center gap-2 items-center transition ">
      <button
        aria-label="write a comment"
        onClick={() => {
          /*
          when this buttom is clicked, the comment input will be focused
          and comments will be shown
          */
          setShowComments(true);
          if (commentInput.current) {
            commentInput.current.focus();
          }
        }}
        className="flex w-full gap-2 outline-none transition hover:text-[var(--primary-color)]"
      >
        <CommentIcon className="w-6" />
        {windowWidth > 100 && <>{convertToUnit(commentsCount)} </>}
      </button>
    </div>
  );
};
export default Comments;
