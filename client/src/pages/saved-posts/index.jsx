import { useEffect, useState } from "react";

import Layout from "layout";
import Post from "components/post";
import LoadingPost from "components/posts/LoadingPost";

import axiosClient from "utils/AxiosClient";
const SavedPosts = () => {
  const [posts, setPosts] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchSavedPosts = () => {
    setIsFetching(true);
    axiosClient(`saved_posts/`)
      .then((response) => setPosts(response.data))
      .catch(() => {})
      .finally(() => setIsFetching(false));
  };

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  return (
    <Layout>
      <div className="lg:w-4/5 center">
        {posts?.length === 0 && !isFetching && (
          <div className="p-3 text-xl font-bold">No posts</div>
        )}
        {isFetching && <LoadingPost />}
        <div className="flex flex-col gap-3 justify-center">
          {posts?.map((post) => (
            <Post key={post._id} post={post} />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default SavedPosts;
