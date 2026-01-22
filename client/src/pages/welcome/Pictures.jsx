import { useRef, useState } from "react";

import AddPhotoIcon from "assets/icons/add-photo.svg?react";
import CloseIcon from "assets/icons/cross.svg?react";

const Pictures = (props) => {
  const { setData } = props;
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [coverPicPreview, setCoverPicPreview] = useState(null);

  const coverPicInputBtn = useRef();
  const profilePicInputBtn = useRef();

  return (
    <div className="mb-20">
      <div
        className={`cover-image-container flex items-center justify-center relative bg-alt h-[150px] sm:h-[250px] w-full ${
          !coverPicPreview ? "cursor-pointer" : ""
        }`}
        style={{
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        }}
      >
        <input
          accept="image/*, image/heic, image/heif"
          style={{ display: "none" }}
          type="file"
          ref={coverPicInputBtn}
          onChange={(e) => {
            const reader = new FileReader();
            if (e.target.files[0]) {
              reader.readAsDataURL(e.target.files[0]);
              reader.addEventListener("load", (e) =>
                setCoverPicPreview(e.currentTarget.result),
              );
              setData((prev) => ({ ...prev, coverPic: e.target.files[0] }));
            }
          }}
        />
        {!coverPicPreview && (
          <div
            className="h-full w-full flex justify-center items-center"
            onClick={() => {
              if (!coverPicPreview) {
                coverPicInputBtn.current.click();
              }
            }}
            style={{
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
            }}
          >
            <AddPhotoIcon className="icon" />
          </div>
        )}
        {coverPicPreview && (
          <div
            className="relative h-full w-full overflow-hidden"
            style={{
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
            }}
          >
            <button
              className="absolute left-1 top-1 w-6 bg-200 circle p-1 shadow-md z-10"
              onClick={() => {
                setData((prev) => ({ ...prev, coverPic: null }));
                setCoverPicPreview(null);
              }}
            >
              <CloseIcon />
            </button>
            <img className="h-full w-full" src={coverPicPreview} />
          </div>
        )}
        <div
          className={`absolute bottom-0 left-0 profile-image-container translate-y-[50%] translate-x-5  w-32 sm:w-36 ${
            !profilePicPreview ? "cursor-pointer" : ""
          }`}
          onClick={() => {
            if (!profilePicPreview) {
              profilePicInputBtn.current.click();
            }
          }}
        >
          {profilePicPreview && (
            <button
              className="absolute left-3 top-3 w-6 bg-200 circle p-1 shadow-md z-10"
              onClick={() => {
                setData((prev) => ({ ...prev, profilePic: null }));
                setProfilePicPreview(null);
              }}
            >
              <CloseIcon />
            </button>
          )}
          <div className="circle border-2 bg-300">
            <input
              accept="image/*, image/heic, image/heif"
              style={{ display: "none" }}
              type="file"
              ref={profilePicInputBtn}
              onChange={(e) => {
                const reader = new FileReader();
                if (e.target.files[0]) {
                  reader.readAsDataURL(e.target.files[0]);
                  reader.addEventListener("load", (e) =>
                    setProfilePicPreview(e.currentTarget.result),
                  );
                  setData((prev) => ({
                    ...prev,
                    profilePic: e.target.files[0],
                  }));
                }
              }}
            />
            {!profilePicPreview && (
              <div>
                <AddPhotoIcon className="icon" />
              </div>
            )}
            {profilePicPreview && (
              <div className="relative h-full w-full flex items-center justify-center">
                <img
                  className="h-full max-w-fit min-w-full"
                  src={profilePicPreview}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pictures;
