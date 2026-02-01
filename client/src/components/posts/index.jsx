import { useState, useEffect, useRef, createContext, useContext } from "react";

import Post from "components/post";
import CreatePost from "components/create-post";
import LoadingPost from "./LoadingPost";
import NoConnectionMessage from "./NoConnectionMessage";

import axiosClient from "utils/AxiosClient";
import { ProfileContext } from "pages/profile";

export const PostsContext = createContext();

const Posts = () => {
  const userId = useContext(ProfileContext)?._id;

  const [message, setMessage] = useState(null);
  const [posts, setPosts] = useState(null);
  const [isPostsFinished, setIsPostsFinished] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const postsEnd = useRef();

  const fetchPosts = () => {
    if (isFetching) return;

    setIsFetching(true);
    const requestURL = userId
      ? `posts/user?userId=${userId}&cursor=${posts?.at(-1)?.createdAt}`
      : "posts";

    axiosClient
      .get(requestURL)
      .then((response) => {
        // if the response is an empty array then the user's post's are finished
        if (response.data?.length === 0) {
          setIsPostsFinished(true);
        }
        setPosts((prev) =>
          prev ? [...prev, ...response.data] : [...response.data],
        );
      })
      .catch(() => {
        setMessage("An error occurred. please try again later.");
      })
      .finally(() => {
        setIsFetching(false);
      });
  };

  // fetch posts once after loading the page
  useEffect(() => {
    const abortController = new AbortController();

    const requestURL = userId ? `posts/user?userId=${userId}` : "posts";

    setIsFetching(true);
    axiosClient
      .get(requestURL, { signal: abortController.signal })
      .then((response) => {
        // if the response is an empty array then the user's post's are finished
        if (response?.data?.length === 0) {
          setIsPostsFinished(true);
        }

        setPosts(response.data);
      })
      .catch((error) => {
        // Don't set error message if request was aborted
        if (error.name !== "CanceledError") {
          setMessage("An error occurred. Please try again later.");
        }
      })
      .finally(() => {
        setIsFetching(false);
      });

    // Cleanup function to abort the request if component unmounts or effect runs again
    return () => {
      abortController.abort();
    };
  }, [userId]);

  // scroll listener to fetch next page
  useEffect(() => {
    const updatePage = () => {
      const postsEndLocation = Math.floor(postsEnd.current?.offsetTop || 0);
      const scroll = Math.floor(window.scrollY + window.innerHeight);

      if (scroll >= postsEndLocation * 0.8) {
        if (!isPostsFinished && !isFetching) {
          fetchPosts();
          window.removeEventListener("scrollend", updatePage);
        }
      }
    };
    window.addEventListener("scrollend", updatePage);
    return () => window.removeEventListener("scrollend", updatePage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPostsFinished, isFetching]);

  return (
    <PostsContext.Provider value={{ posts, setPosts }}>
      <CreatePost />
      <div className="flex flex-col gap-y-4 items-center">
        {posts?.map((post) => (
          <Post key={post._id} post={post} />
        ))}

        {posts?.length !== 0 && !isPostsFinished && (
          <div className="w-full" ref={postsEnd}>
            <LoadingPost />
          </div>
        )}

        {posts?.length === 0 && <>No posts</>}

        {message && !isPostsFinished && (
          <NoConnectionMessage
            onClick={() => {
              setMessage("");
              fetchPosts();
            }}
            message={message}
          />
        )}
      </div>
    </PostsContext.Provider>
  );
};

export default Posts;
