import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { ProfileContext } from "pages/profile";
import axiosClient from "utils/AxiosClient";
import { setShowMessage } from "state";

const FollowToggleBtn = ({
  id: accountToFollowId,
  isFollowing: isFollowingProp,
  setCount,
}) => {
  const _id = useContext(ProfileContext)?._id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const myProfile = useSelector((state) => state.profile);
  const myProfileId = myProfile?._id;

  const [isFollowing, setIsFollowing] = useState(isFollowingProp);
  const followToggle = () => {
    axiosClient
      .patch(
        `/profile/${
          isFollowing ? "unfollow" : "follow"
        }?userId=${accountToFollowId}`,
      )
      .then(() => {
        if (_id === myProfileId && setCount) {
          setCount((prev) => prev + (isFollowing ? -1 : 1));
        }
        setIsFollowing(!isFollowing);
      })
      .catch((err) => {
        if (err.response) {
          dispatch(
            setShowMessage({
              message: err.response.data?.message,
              type: "error",
            }),
          );
          navigate(-1);
        }
      })
      .finally(() => {
        setIsFollowing(!isFollowing);
      });
  };

  return (
    <>
      {/* only show "follow toggle" button for loggedin user */}
      {myProfile && accountToFollowId !== myProfileId && (
        <button
          className={`py-1 px-3 h-fit rounded-xl shadow-md text-sm ${
            isFollowing ? "bg-alt" : "bg-primary text-white"
          }`}
          onClick={followToggle}
        >
          {isFollowing ? "Unfollow" : "Follow"}
        </button>
      )}
    </>
  );
};

export default FollowToggleBtn;
