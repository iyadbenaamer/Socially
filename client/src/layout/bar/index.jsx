import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import Headroom from "react-headroom";

import BarItem from "./BarItem";

import HomeIcon from "assets/icons/home.svg?react";
import NotificationsIcon from "assets/icons/notifications.svg?react";
import MessagesIcon from "assets/icons/message-text.svg?react";
import SavedPostsIcon from "assets/icons/saved-posts.svg?react";
import SearchIcon from "assets/icons/search.svg?react";
import UserPicture from "components/UserPicture";

const Bar = () => {
  const profile = useSelector((state) => state.profile);
  const location = useLocation();

  const unreadMessagesCount = useSelector((state) => state.unreadMessagesCount);
  const unreadNotificationsCount = useSelector(
    (state) => state.unreadNotificationsCount,
  );

  return (
    <Headroom
      style={{
        position: "fixed",
        left: 0,
        bottom: 0,
        top: "auto",
        width: "100%",
        zIndex: 1000,
      }}
      disableInlineStyles
    >
      <div className="bg-300 w-full h-[50px] z-10 border-t border-t-[#00000073] py-1">
        <ul className="flex gap-3 items-center h-full px-2 w-full">
          <BarItem to={"/"}>
            <HomeIcon
              className={`icon ${
                location.pathname === "/" ? "text-primary" : ""
              }`}
            />
          </BarItem>

          <BarItem to={`/profile/${profile.username}`}>
            <span className="w-[36px]">
              <UserPicture profile={profile} noLink />
            </span>
          </BarItem>

          <BarItem to={"/search"}>
            <SearchIcon
              className={`icon ${
                location.pathname === "/search" ? "text-primary" : ""
              }`}
            />
          </BarItem>

          <BarItem to={"/notifications"}>
            <div className="relative w-full">
              <NotificationsIcon
                className={`icon ${
                  location.pathname === "/notifications" ? "text-primary" : ""
                }`}
              />
              {unreadNotificationsCount > 0 ? (
                <div className="absolute bottom-0 -right-2 circle w-5 p-[1px] bg-red-500 text-white text-[8px] sm:text-[10px]">
                  {unreadNotificationsCount > 99
                    ? "99+"
                    : unreadNotificationsCount}
                </div>
              ) : null}
            </div>
          </BarItem>

          <BarItem to={"/messages"}>
            <div className="relative w-full">
              <MessagesIcon
                className={`icon ${
                  location.pathname.startsWith("/messages")
                    ? "text-primary"
                    : ""
                }`}
              />
              {unreadMessagesCount > 0 ? (
                <div className="absolute bottom-0 -right-2 circle w-5 p-[1px] bg-red-500 text-white text-[8px] sm:text-[10px]">
                  {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                </div>
              ) : null}
            </div>
          </BarItem>

          <BarItem to={"/saved-posts"}>
            <SavedPostsIcon
              className={`icon ${
                location.pathname === "/saved-posts" ? "text-primary" : ""
              }`}
            />
          </BarItem>
        </ul>
      </div>
    </Headroom>
  );
};

export default Bar;
