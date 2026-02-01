import BackIcon from "assets/icons/arrow-left.svg?react";
import { useNavigate } from "react-router-dom";

const BackBtn = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="hidden lg:flex justify-center fixed left-0 top-[45px] py-2 bg-100 z-[100] w-[100vw]">
        <div className="lg:w-1/2 md:w-2/3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-hovered"
            aria-label="Go back"
          >
            <div className="w-8">
              <BackIcon fill="currentColor" />
            </div>
            <div>Back</div>
          </button>
        </div>
      </div>
      <div className="flex lg:hidden py-2 bg-100 z-[100]">
        <div className="lg:w-1/2 md:w-2/3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-hovered"
            aria-label="Go back"
          >
            <div className="w-8">
              <BackIcon fill="currentColor" />
            </div>
            <div>Back</div>
          </button>
        </div>
      </div>
    </>
  );
};

export default BackBtn;
