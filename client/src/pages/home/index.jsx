import Bar from "layout/bar";
import Sidebar from "layout/sidebar";
import { Content } from "./content";
import Following from "./following";

import { useWindowWidth } from "hooks/useWindowWidth";

const Home = () => {
  const windowWidth = useWindowWidth();

  return (
    <div className="grid grid-cols-12 pt-5 pb-28">
      {windowWidth >= 1024 && (
        <div className="sidebar flex justify-center col-span-3">
          <Sidebar />
        </div>
      )}
      <div className="content col-span-12 md:col-span-10 md:col-start-2 lg:col-span-8 xl:col-span-6">
        <Content />
      </div>
      {windowWidth >= 1280 && (
        <div className="conacts col-span-3 xl:col-start-10">
          <Following />
        </div>
      )}
      {windowWidth < 1024 && <Bar />}
    </div>
  );
};
export default Home;
