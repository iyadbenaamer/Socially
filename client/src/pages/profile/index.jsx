import { createContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";

import Bar from "layout/bar";
import Content from "./Content";
import CoverPicture from "./CoverPicture";
import MessagingBtn from "./MessagingBtn";
import AboutUser from "./AboutUser";
import FollowToggleBtn from "components/FollowingBtn";

import { useWindowWidth } from "hooks/useWindowWidth";

import axiosClient from "utils/AxiosClient";

export const ProfileContext = createContext();

const Profile = () => {
  const windowWidth = useWindowWidth();
  const navigate = useNavigate();
  const { username } = useParams();
  const myProfile = useSelector((state) => state.profile);

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const getProfile = () => {
      axiosClient(`profile?username=${username}`)
        .then((response) => {
          setProfile(response.data);
        })
        .catch(() => navigate("/not-found", { replace: true }));
    };
    setProfile(null);
    getProfile();
  }, [username]);

  return (
    <ProfileContext.Provider value={{ ...profile, setProfile }}>
      <div className="container relative center">
        <div className="mb-20">
          <CoverPicture />
          {profile && (
            <div dir="rtl" className="absolute w-[95%] my-5">
              {myProfile && myProfile.username !== username && (
                <div className="flex gap-2 items-center">
                  <FollowToggleBtn
                    id={profile._id}
                    isFollowing={profile.isFollowing}
                  />
                  <MessagingBtn id={profile._id} />
                </div>
              )}
            </div>
          )}
        </div>
        {!profile && (
          <div className="flex flex-col gap-2 py-2 px-4">
            <div className="rounded-xl h-5 w-40 loading"></div>
            <div className="user-name loading w-32 h-4 rounded-xl my-1"></div>
            <div className="loading rounded-xl w-36 h-3"></div>
          </div>
        )}
        {profile && <AboutUser />}
        {profile && <Content profile={profile} />}
      </div>
      {windowWidth < 768 && myProfile && <Bar />}
    </ProfileContext.Provider>
  );
};

export default Profile;
