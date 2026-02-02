import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import Menu from "./Menu";
import ToggleTheme from "components/ToggleTheme";

import darkLogo from "assets/icons/logo-dark.svg";
import lightLogo from "assets/icons/logo-light.svg";
import "./index.css";

const Header = () => {
  const isLoggedin = Boolean(
    useSelector((state) => state.authStatus.isLoggedin),
  );
  const theme = useSelector((state) => state.settings.theme);

  return (
    <header className="sticky top-0 z-[200] w-full bg-300 shadow-lg transition">
      <div className="container px-4 py-2 m-auto flex gap-3 items-center justify-between h-[45px]">
        <Link to="/">
          {theme === "light" ? (
            <img src={lightLogo} alt="Socially" />
          ) : (
            <img src={darkLogo} alt="Socially" />
          )}
        </Link>
        {isLoggedin && <Menu />}
        {!isLoggedin && <ToggleTheme />}
      </div>
    </header>
  );
};
export default Header;
