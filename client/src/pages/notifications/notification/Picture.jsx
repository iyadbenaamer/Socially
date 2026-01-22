import PreloadedImage from "components/PreloadedImage";

import LikeIcon from "assets/icons/like.svg?react";
import CommentIcon from "assets/icons/comments.svg?react";
import ShareIcon from "assets/icons/share.svg?react";

const Picture = (props) => {
  const { profile, notificationType } = props;
  const isLikeType = new Array("postLike", "commentLike", "replyLike").includes(
    notificationType,
  );
  return (
    <div className="relative">
      <PreloadedImage src={profile?.profilePicPath} />
      {isLikeType && (
        <div className="absolute -right-[7px] bottom-0.5 scale-[3.5] h-5 w-5">
          <LikeIcon color="#e53935" />
        </div>
      )}
      {notificationType === "comment" ||
        (notificationType === "reply" && (
          <div className="absolute -right-[5px] bottom-1 h-5 w-5">
            <div className="text-primary">
              <CommentIcon className="w-6" fill="white" />
            </div>
          </div>
        ))}
      {notificationType === "share" && (
        <div className="absolute -right-[5px] bottom-1 h-5 w-5">
          <div className="text-primary">
            <ShareIcon className="w-6" fill="white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Picture;
