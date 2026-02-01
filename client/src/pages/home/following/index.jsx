import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import UserPicture from "components/UserPicture";
import HoverScrollContainer from "components/HoverScrollContainer";

import axiosClient from "utils/AxiosClient";

const Following = () => {
  const myProfile = useSelector((state) => state.profile);

  const [following, setFollowing] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    axiosClient(`profile/following?id=${myProfile._id}`)
      .then((response) => {
        setFollowing(response.data.following);
        setError(false);
      })
      .catch(() => {
        setError(true);
      });
  }, []);

  if (following?.length === 0 && !error) return null;

  return (
    <section className="fixed flex flex-col gap-5 px-2 h-[85vh]">
      <h1 className="text-lg">People you follow</h1>
      <HoverScrollContainer className="w-[250px] center">
        <ul className="flex flex-col gap-3 py-2 h-full overflow-x-hidden z-40">
          {following?.map((profile) => {
            const { username, firstName, lastName } = profile;
            return (
              <li key={profile._id} className="flex items-center">
                <div className="account flex gap-2 items-center">
                  <span className="w-12">
                    <UserPicture noCard profile={profile} />
                  </span>
                  <Link to={`/profile/${username}`} className="link">
                    {firstName} {lastName}
                  </Link>
                </div>
              </li>
            );
          })}
          {error && <li className="text-slate-500">Failed to load.</li>}
        </ul>
      </HoverScrollContainer>
    </section>
  );
};
export default Following;
