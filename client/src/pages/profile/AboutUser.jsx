import { useContext } from "react";

import { ProfileContext } from ".";

import Following from "./Following";
import Followers from "./followers";

import LocationIcon from "assets/icons/location.svg?react";
import CalenderIcon from "assets/icons/calender.svg?react";

const AboutUser = () => {
  const { firstName, lastName, username, bio, location, joinedAt } =
    useContext(ProfileContext);

  const joinedAtMonth = new Date(joinedAt).toLocaleString("default", {
    month: "long",
  });
  const joinedAtYear = new Date(joinedAt).getFullYear();

  return (
    <div className="flex flex-col mx-2 gap-3">
      {/* contains name and username */}
      <div>
        <div className="name text-2xl">
          {!firstName && !lastName && (
            <div className="rounded-xl h-4 w-36 loading"></div>
          )}
          {(firstName || lastName) && (
            <>
              {firstName} {lastName}
            </>
          )}
        </div>
        {!username && (
          <div className="user-name loading w-32 h-4 rounded-xl my-1"></div>
        )}
        {username && <div className="user-name text-50">@{username}</div>}
      </div>
      {bio && (
        <div className="bio text-sm text-ellipsis overflow-hidden max-w-md">
          {bio}
        </div>
      )}
      <div className="flex flex-wrap gap-2 items-center">
        {!username && <div className="loading rounded-xl w-36 h-3"></div>}
        {location && username && (
          <div className="text-50 flex gap-1 items-center">
            <LocationIcon />
            {location}
          </div>
        )}
        <div className="text-50 flex gap-1 items-center text-sm">
          <CalenderIcon />
          Joined at {joinedAtMonth} {joinedAtYear}
        </div>
      </div>
      {!username && <div className="loading rounded-xl w-40 h-4"></div>}
      {username && (
        <div className="flex gap-2">
          <div>
            <Following />
          </div>
          <div>
            <Followers />
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutUser;
