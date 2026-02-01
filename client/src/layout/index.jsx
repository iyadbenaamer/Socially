import Sidebar from "./sidebar";
import Bar from "./bar";

import { useWindowWidth } from "hooks/useWindowWidth";

const Layout = ({ children }) => {
  const windowWidth = useWindowWidth();

  return (
    <>
      <div className="grid grid-cols-12 pt-5 pb-28">
        {windowWidth >= 1024 && (
          <div className="sidebar flex justify-center col-span-3">
            <Sidebar />
          </div>
        )}
        <div className="content col-span-12 md:col-span-10 md:col-start-2 lg:col-span-8 xl:col-span-6">
          {children}
        </div>
      </div>
      {windowWidth < 1024 && <Bar />}
    </>
  );
};

export default Layout;
