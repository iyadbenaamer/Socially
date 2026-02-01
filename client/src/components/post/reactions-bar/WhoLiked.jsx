import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import UserPicture from "components/UserPicture";

import axiosClient from "utils/AxiosClient";
import FollowToggleBtn from "components/FollowingBtn";
import HoverWrapper from "components/user-hover-card/HoverWrapper";
import LoadingProfiles from "components/LoadingProfiles";

const WhoLiked = (props) => {
  const { id, type } = props;
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const url = `${type}/likes?id=${id}&cursor=${cursor}`;
      await axiosClient(url)
        .then((response) => {
          setLikes((prev) => [...prev, ...response.data]);
          setCursor(
            response.data.length > 0
              ? response.data[response.data.length - 1].createdAt
              : cursor,
          );
        })
        .catch(() => setMessage("Failed to load likes."))
        .finally(() => setLoading(false));
    };
    fetchUsers();
  }, []);

  return (
    <div className="w-[90vw] md:w-[600px] p-2 min-h-[50vh]">
      <ul className="flex flex-col gap-3">
        {loading && !message && <LoadingProfiles />}
        {likes?.map((profile) => (
          <li key={profile._id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-12">
                <UserPicture profile={profile} />
              </span>
              <HoverWrapper profile={profile}>
                <Link
                  to={`/profile/${profile.username}`}
                  className="hover:underline h-fit"
                >
                  {profile.firstName} {profile.lastName}
                </Link>
              </HoverWrapper>
            </div>
            <FollowToggleBtn
              id={profile._id}
              isFollowing={profile.isFollowing}
            />
          </li>
        ))}
        {likes?.length === 0 && message && (
          <p className="text-sm text-slate-400">{message}</p>
        )}
      </ul>
    </div>
  );
};

export default WhoLiked;
