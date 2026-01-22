import { useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Lottie from "react-lottie";

import WhoLiked from "./WhoLiked";

import Dialog from "components/dialog";

import { PostContext } from "..";
import convertToUnit from "utils/convertToUnit";
import axiosClient from "utils/AxiosClient";
import { setShowMessage } from "state";

import animationData from "assets/icons/like.json";
import LikeIcon from "assets/icons/like.svg?react";

const Like = () => {
  const postContext = useContext(PostContext);

  const { _id: postId, creatorId: userId } = postContext;

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.profile);

  const [likesCount, setLikesCount] = useState(postContext.likesCount);
  const [isLiked, setIsliked] = useState(postContext.isLiked);
  const [firstLoad, setFirstLoad] = useState(true);
  const [showLikes, setShowLikes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const options = {
    loop: false,
    ariaRole: "icon-hover",
    autoplay: true,
    animationData,
  };

  const likeToggle = async () => {
    if (!profile || isLoading) return;

    setIsLoading(true);
    setFirstLoad(false);

    // Store original state for potential rollback
    const originalIsLiked = isLiked;
    const originalCount = likesCount;

    // Optimistic update
    const newIsLiked = !isLiked;
    setIsliked(newIsLiked);

    // Make API request
    let url = `post/like-toggle?userId=${userId}&postId=${postId}`;
    try {
      const response = await axiosClient.patch(url);
      // Update with server response
      setIsliked(response.data?.isLiked);
      setLikesCount((prev) => {
        if (isLiked) {
          return prev - 1;
        } else {
          return prev + 1;
        }
      });
    } catch (err) {
      if (err.response) {
        dispatch(
          setShowMessage({ message: err.response.data.message, type: "error" }),
        );
      } else {
        dispatch(
          setShowMessage({
            message: "An error occurred. Please try again later.",
            type: "error",
          }),
        );
      }
      // Rollback on error
      setLikesCount(originalCount);
      setIsliked(originalIsLiked);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-center gap-2 items-center transition ">
        <div className="relative">
          <div
            className="md:cursor-pointer absolute top-0 left-0 z-10 h-full w-full"
            onClick={() => {
              if (profile) {
                likeToggle();
              } else {
                navigate("/login");
              }
            }}
          ></div>
          <div className="w-8 scale-[3]">
            {isLiked && !firstLoad ? (
              <Lottie options={options} ariaRole="" />
            ) : (
              <LikeIcon color={`${isLiked ? "#e53935" : "transparent"}`} />
            )}
          </div>
        </div>
        {likesCount > 0 ? (
          <button
            className="relative link"
            onClick={() => setShowLikes(!showLikes)}
          >
            {convertToUnit(likesCount)}
          </button>
        ) : (
          <>0</>
        )}
      </div>
      <Dialog isOpened={showLikes} setIsOpened={setShowLikes}>
        <WhoLiked type="post" id={postId} />
      </Dialog>
    </>
  );
};
export default Like;
