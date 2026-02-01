import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const UserPicture = ({ profile, isOnline }) => {
  if (!profile) return null;
  const { _id: id, firstName, lastName, profilePicPath } = profile;

  const myProfile = useSelector((state) => state.profile);

  const [loadedSrc, setLoadedSrc] = useState(null);

  useEffect(() => {
    if (!profilePicPath) return;

    const img = new Image();
    img.src = profilePicPath;

    img
      .decode()
      .then(() => setLoadedSrc(profilePicPath))
      .catch(() => setLoadedSrc(null));
  }, [profilePicPath]);

  return (
    <div className="relative">
      <div className="circle w-12 h-12 shadow-md border-2">
        {loadedSrc ? (
          <img
            src={loadedSrc}
            alt={`${firstName} ${lastName}`}
            width={48}
            height={48}
            className="h-full w-full object-cover circle transition-opacity duration-200 ease-in"
          />
        ) : (
          <div
            className="h-full w-full bg-gray-300 animate-pulse rounded-full"
            style={{ width: 48, height: 48 }}
          />
        )}
      </div>

      {(isOnline || myProfile?._id === id) && (
        <div className="green-dot h-3 w-3 circle bg-green-700 absolute left-0 bottom-0.5"></div>
      )}
    </div>
  );
};

export default UserPicture;
