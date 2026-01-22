import { useSelector } from "react-redux";

import LoadingIcon from "assets/icons/laoding-app.svg?react";

const Loading = () => {
  const theme = useSelector((state) => state.settings.theme);
  return (
    <div
      style={{ zIndex: 1000 }}
      className={`h-full w-full fixed ${
        theme === "light"
          ? "bg-[var(--bg-light-200)]"
          : "bg-[var(--bg-dark-200)]"
      } flex items-center justify-center`}
    >
      <LoadingIcon width={200} />
    </div>
  );
};

export default Loading;
