import { useContext, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";

import Dialog from "components/dialog";
import UserPicture from "components/UserPicture";
import FollowToggleBtn from "components/FollowingBtn";
import HoverWrapper from "components/user-hover-card/HoverWrapper";
import LoadingProfiles from "components/LoadingProfiles";

import { ProfileContext } from ".";

import axiosClient from "utils/AxiosClient";
import convertToUnit from "utils/convertToUnit";

const Following = () => {
  const { _id, followingCount } = useContext(ProfileContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const showFollowing = searchParams.get("dialog") === "following";
  const myProfile = useSelector((state) => state.profile);

  const setFollowingDialog = (open, replace = true) =>
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (open) {
          sp.set("dialog", "following");
        } else {
          sp.delete("dialog");
        }
        return sp;
      },
      { replace },
    );

  const [following, setFollowing] = useState(null);
  const [count, setCount] = useState(followingCount);
  const [cursor, setCursor] = useState("000000000000000000000000"); // last fetched id (cursor)
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useState(null)[0]; // placeholder to maintain hook order (will set via callback ref)
  const [loaderEl, setLoaderEl] = useState(null); // actual element ref
  const fetchProfiles = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const result = await axiosClient(
      `profile/following?id=${_id}&cursor=${cursor}`,
    )
      .then((response) => response.data)
      .catch(() => null);
    const newItems = result?.following || [];
    setFollowing((prev) => (prev ? [...prev, ...newItems] : newItems));
    // Update hasMore (stop when API returns empty array)
    if (
      newItems.length === 0 ||
      newItems.length + parseInt(following?.length || 0) >= followingCount
    ) {
      setHasMore(false);
    }
    const newCursor = newItems.slice(-1)[0]?._id;
    if (newCursor && newCursor !== cursor) {
      setCursor(newCursor);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (following?.length === 0) {
      setCount(0);
      // Close the dialog by removing the param
      setFollowingDialog(false, true);
    }
  }, [following, setSearchParams]);

  useEffect(() => {
    if (!showFollowing) {
      setFollowing(null);
      setCursor("000000000000000000000000");
      setHasMore(true);
      return;
    }
    if (showFollowing && following === null) {
      fetchProfiles();
    }
  }, [showFollowing]);

  // IntersectionObserver to trigger fetch when sentinel enters view
  useEffect(() => {
    if (!showFollowing) return;
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
  }, [loaderEl, hasMore, showFollowing, cursor, following, loading]);

  return (
    <>
      {count > 0 && (
        <div
          className="hover:text-[var(--primary-color)] hover:underline underline-offset-2 cursor-pointer"
          onClick={() => setFollowingDialog(!showFollowing, showFollowing)}
        >
          Following {convertToUnit(count)}
        </div>
      )}
      <Dialog
        title="Following"
        isOpened={showFollowing}
        setIsOpened={(next) => setFollowingDialog(next, true)}
      >
        <div className="px-2 flex flex-col gap-2 min-h-[100vh] w-[90vw] sm:w-[500px]">
          <ul className="flex flex-col gap-3">
            {following?.map((follow) => {
              const { _id: id, username, firstName, lastName } = follow;
              return (
                <li key={id} className="flex items-center justify-between">
                  <div className="account flex gap-2 items-center">
                    <span className="w-12">
                      <UserPicture profile={follow} />
                    </span>
                    <HoverWrapper profile={follow}>
                      <Link to={`/profile/${username}`} className="link">
                        {firstName} {lastName}
                      </Link>
                    </HoverWrapper>
                  </div>
                  {myProfile?._id !== id && (
                    <FollowToggleBtn
                      id={id}
                      isFollowing={follow.isFollowing}
                      setCount={setCount}
                    />
                  )}
                </li>
              );
            })}
            {showFollowing && hasMore && (
              <li ref={setLoaderEl} className="py-2">
                <LoadingProfiles />
              </li>
            )}
          </ul>
        </div>
      </Dialog>
      {count === 0 && <>Following 0</>}
    </>
  );
};

export default Following;
