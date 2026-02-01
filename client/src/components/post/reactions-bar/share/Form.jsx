import { useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { PostContext } from "components/post";
import { PostsContext } from "components/posts";
import SubmitBtn from "components/SubmitBtn";

import { setShowMessage } from "state";
import axiosClient from "utils/AxiosClient";

const Form = (props) => {
  const { data, setData, setIsOpened } = props;
  const postsContext = useContext(PostsContext);
  const { _id: postId, creatorId } = useContext(PostContext);
  const { username: myUsername } = useSelector((state) => state.profile);

  const [isValidPost, setIsValidPost] = useState(false);

  const posts = postsContext?.posts;
  const setPosts = postsContext?.setPosts;

  const { username: currentPageUsername } = useParams();

  const dispatch = useDispatch();

  const submit = async () => {
    const formData = new FormData();
    for (const property in data) {
      formData.append(property, data[property]);
    }
    axiosClient
      .post(`post/share?userId=${creatorId}&postId=${postId}`, formData)
      .then((response) => {
        dispatch(setShowMessage({ message: "Post shared.", type: "info" }));
        /*
        check if the current page is niether another user's page nor the home page
          if so, then the shared post will appear on the top of the existing posts
        */
        if (!currentPageUsername || myUsername == currentPageUsername) {
          if (!setPosts) {
            return;
          }
          if (posts) {
            setPosts([response.data, ...posts]);
          } else {
            setPosts(response.data);
          }
        }
      })
      .catch((err) => {
        dispatch(
          setShowMessage({ message: err.response.data.message, type: "error" }),
        );
      })
      .finally(() => {
        setData({ text: "", location: "" });
        setIsOpened(false);
      });
  };
  useEffect(() => {
    if (data.text != "" && data.text.length <= 40000) {
      setIsValidPost(true);
    } else {
      setIsValidPost(false);
    }
  }, [data]);

  return (
    <div className="flex flex-col gap-3 w-[280px] sm:w-[500px] p-2">
      <textarea
        value={data.text}
        className="mt-2"
        dir="auto"
        name="text"
        placeholder="Type anything about this...."
        onChange={(e) => {
          const text = e.target.value;
          if (text.length <= 40000) {
            setData((prev) => ({ ...prev, text: e.target.value }));
          }
        }}
      />
      <SubmitBtn disabled={!isValidPost} onClick={submit}>
        Share
      </SubmitBtn>
    </div>
  );
};

export default Form;
