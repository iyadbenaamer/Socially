import { useRef, useState } from "react";
import { useDispatch } from "react-redux";

import ToggleTheme from "components/ToggleTheme";

import { logout, toggleTheme } from "state";

import useCloseWidget from "hooks/useCloseWidget";

import DropDownIcon from "assets/icons/drop-down.svg?react";
import LogoutIcon from "assets/icons/logout.svg?react";
import SettingsIcon from "assets/icons/settings.svg?react";

const Menu = () => {
  const [showMenu, setShowMenu] = useState(false);
  const dispatch = useDispatch();
  const menu = useRef(null);

  useCloseWidget(menu, setShowMenu);

  return (
    <div
      ref={menu}
      className="cursor-pointer relative flex justify-center w-10"
      onClick={() => {
        setShowMenu(!showMenu);
      }}
    >
      <DropDownIcon className="icon-hover" />
      {showMenu && (
        <div className="menu bg-300 cursor-pointer absolute top-0 right-0 rounded-xl w-max">
          <ul className="flex flex-col rounded-xl transition">
            <li className="flex gap-2 p-2 bg-hovered w-full">
              <SettingsIcon className="inline mr-2 w-4" />
              Settings
            </li>
            <li
              onClick={() => dispatch(toggleTheme())}
              className="flex gap-2 p-2 bg-hovered w-full"
            >
              <ToggleTheme />
              Theme
            </li>
            <li
              className="flex gap-2 p-2 bg-hovered w-full"
              onClick={() => {
                dispatch(logout());
              }}
            >
              <LogoutIcon className="w-4 inline mr-2 -ml-1" />
              Log out
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Menu;
