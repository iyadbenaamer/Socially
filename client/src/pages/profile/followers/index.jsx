import { useContext, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Dialog from "components/dialog";
import UserPicture from "components/UserPicture";
import FollowToggleBtn from "components/FollowingBtn";
import RemoveFollowerBtn from "./RemoveFollowerBtn";
import LoadingProfiles from "components/LoadingProfiles";
import HoverWrapper from "components/user-hover-card/HoverWrapper";

import { ProfileContext } from "..";

import axiosClient from "utils/AxiosClient";
import convertToUnit from "utils/convertToUnit";
import { useSelector } from "react-redux";

const Followers = () => {
  const { followersCount, _id } = useContext(ProfileContext);
  const myProfile = useSelector((state) => state.profile);
  const [searchParams, setSearchParams] = useSearchParams();
  const showFollowers = searchParams.get("dialog") === "followers";
  const [followers, setFollowers] = useState(null);
  const [count, setCount] = useState(followersCount);
  const [cursor, setCursor] = useState("000000000000000000000000");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loaderEl, setLoaderEl] = useState(null);

  const setFollowersDialog = (open, replace = true) =>
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (open) {
          sp.set("dialog", "followers");
        } else {
          sp.delete("dialog");
        }
        return sp;
      },
      { replace },
    );

  const fetchProfiles = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const result = await axiosClient(
      `profile/followers?id=${_id}&cursor=${cursor}`,
    )
      .then((response) => response.data)
      .catch(() => null);
    const newItems = result?.followers || [];
    setFollowers((prev) => (prev ? [...prev, ...newItems] : newItems));
    if (
      newItems.length === 0 ||
      newItems.length + (followers?.length || 0) >= followersCount
    ) {
      setHasMore(false);
    }
    const newCursor = newItems.slice(-1)[0]?.followId;
    if (newCursor && newCursor !== cursor) {
      setCursor(newCursor);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (followers?.length === 0) {
      setCount(0);
      setFollowersDialog(false, true);
    }
  }, [followers, setSearchParams]);

  useEffect(() => {
    if (!showFollowers) {
      setFollowers(null);
      setCursor("000000000000000000000000");
      setHasMore(true);
      return;
    }
    if (showFollowers && followers === null) {
      fetchProfiles();
    }
  }, [showFollowers]);

  useEffect(() => {
    if (!showFollowers) return;
    if (!hasMore) return;
    if (!loaderEl) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            fetchProfiles();
          }
        });
      },
      { root: null, rootMargin: "200px", threshold: 0 },
    );
    observer.observe(loaderEl);
    return () => observer.disconnect();
  }, [loaderEl, hasMore, showFollowers, cursor, followers, loading]);

  return (
    <>
      {count > 0 && (
        <div
          className="hover:text-[var(--primary-color)] hover:underline underline-offset-2 cursor-pointer"
          onClick={() => setFollowersDialog(!showFollowers, showFollowers)}
        >
          Followers {convertToUnit(count)}
        </div>
      )}
      <Dialog
        title="Followers"
        isOpened={showFollowers}
        setIsOpened={(next) => setFollowersDialog(next, true)}
      >
        <div className="px-4 flex flex-col gap-2 min-h-[50vh] w-[90vw] sm:w-[500px]">
          <ul className="flex flex-col gap-5">
            {followers?.map((profile) => {
              const { _id: id, username, firstName, lastName } = profile;
              return (
                <li key={id} className="flex items-center justify-between">
                  <div className="account flex gap-2 items-center">
                    <span className="w-12">
                      <UserPicture profile={profile} />
                    </span>
                    <HoverWrapper profile={profile}>
                      <Link to={`/profile/${username}`} className="link">
                        {firstName} {lastName}
                      </Link>
                    </HoverWrapper>
                  </div>
                  <div className="flex gap-2 items-center">
                    <FollowToggleBtn
                      id={id}
                      isFollowing={profile.isFollowing}
                    />
                    {_id === myProfile?._id && (
                      <RemoveFollowerBtn
                        id={id}
                        setFollowers={setFollowers}
                        setCount={setCount}
                      />
                    )}
                  </div>
                </li>
              );
            })}
            {showFollowers && hasMore && followers?.length < followersCount && (
              <li ref={setLoaderEl} className="py-2">
                <LoadingProfiles />
              </li>
            )}
          </ul>
        </div>
      </Dialog>
      {count === 0 && <>Followers 0</>}
    </>
  );
};

export default Followers;
