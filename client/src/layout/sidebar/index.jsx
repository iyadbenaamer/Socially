import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

import HomeIcon from "assets/icons/home.svg?react";
import NotificationsIcon from "assets/icons/notifications.svg?react";
import MessagesIcon from "assets/icons/message-text.svg?react";
import SavedPostsIcon from "assets/icons/saved-posts.svg?react";
import SearchIcon from "assets/icons/search.svg?react";

import SidebarItem from "./SidebarItem";
import UserPicture from "components/UserPicture";

const Sidebar = () => {
  const profile = useSelector((state) => state.profile);
  const location = useLocation();

  const unreadMessagesCount = useSelector((state) => state.unreadMessagesCount);
  const unreadNotificationsCount = useSelector(
    (state) => state.unreadNotificationsCount,
  );

  return (
    <aside className="fixed">
      <ul className="flex flex-col gap-3 px-2 w-full">
        <SidebarItem to={"/"} name={"Home"}>
          <HomeIcon
            className={`${location.pathname === "/" ? "text-primary" : ""}`}
          />
        </SidebarItem>
        <SidebarItem
          to={`/profile/${profile.username}`}
          name={`${profile.firstName} ${profile.lastName}`}
        >
          <div className="w-9">
            <UserPicture profile={profile} noLink />
          </div>
        </SidebarItem>

        <SidebarItem to={"/search"} name={"Search"}>
          <div className="relative">
            <SearchIcon
              className={`${
                location.pathname === "/search" ? "text-primary" : ""
              }`}
            />
          </div>
        </SidebarItem>

        <SidebarItem to={"/notifications"} name={"Notifications"}>
          <div className="relative">
            <NotificationsIcon
              className={`${
                location.pathname === "/notifications" ? "text-primary" : ""
              }`}
            />
            {unreadNotificationsCount > 0 ? (
              <div className="absolute bottom-0 -right-2 circle w-5 h-5 p-[1px] bg-red-500 text-white text-[10px]">
                {unreadNotificationsCount > 99
                  ? "99+"
                  : unreadNotificationsCount}
              </div>
            ) : null}
          </div>
        </SidebarItem>

        <SidebarItem to={"/messages"} name={"Messages"}>
          <div className="relative">
            <MessagesIcon
              className={`${
                location.pathname.startsWith("/messages") ? "text-primary" : ""
              }`}
            />
            {unreadMessagesCount > 0 ? (
              <div className="absolute bottom-0 -right-2 circle w-5 h-5 p-[1px] bg-red-500 text-white text-[10px]">
                {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
              </div>
            ) : null}
          </div>
        </SidebarItem>

        <SidebarItem to={"/saved-posts"} name={"Saved Posts"}>
          <SavedPostsIcon
            className={`${
              location.pathname === "/saved-posts" ? "text-primary" : ""
            }`}
          />
        </SidebarItem>
      </ul>
    </aside>
  );
};

export default Sidebar;
