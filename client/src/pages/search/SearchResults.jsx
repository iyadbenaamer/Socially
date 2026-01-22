import { Link } from "react-router-dom";

import FollowToggleBtn from "components/FollowingBtn";
import UserPicture from "components/UserPicture";

const SearchResults = ({ results, hasSearched }) => {
  if (!hasSearched) {
    return null;
  }

  if (results.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">No results found</div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {results.map((profile) => (
        <div
          key={profile._id}
          className="flex items-start gap-4 transition-all rounded-xl xl:w-3/4"
        >
          <span className="w-12">
            <UserPicture profile={profile} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between gap-24">
              <Link key={profile._id} to={`/profile/${profile.username}`}>
                <h3 className="font-bold text-md hover:underline">
                  {profile.firstName} {profile.lastName}
                </h3>
                <p className="text-sm text-gray-500 -translate-y-[3px]">
                  @{profile.username}
                </p>
              </Link>
              <FollowToggleBtn
                id={profile._id}
                isFollowing={profile.isFollowing}
              />
            </div>
            {profile.bio && (
              <p className="text-sm line-clamp-3">{profile.bio}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
