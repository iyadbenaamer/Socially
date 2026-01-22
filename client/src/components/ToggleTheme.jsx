import { useDispatch, useSelector } from "react-redux";

import { toggleTheme } from "state";

import MoonIcon from "assets/icons/moon.svg?react";

const ToggleTheme = () => {
  const theme = useSelector((state) => state.settings.theme);

  const dispatch = useDispatch();

  return (
    <MoonIcon
      onClick={() => dispatch(toggleTheme())}
      style={{
        display: "inline",
        marginRight: 10,
        transform: "translateX(1px)",
      }}
      width={13}
      fill={theme === "dark" ? "#daa520" : "#5b5d67"}
    />
  );
};
export default ToggleTheme;
