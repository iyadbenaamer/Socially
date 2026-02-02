import { useContext, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { PostContext } from "components/post";
import { PostsContext } from "components/posts";
import DropZone from "components/dropzone";
import SharedPost from "components/SharedPost";
import SubmitBtn from "components/SubmitBtn";

import { setShowMessage } from "state";
import axiosClient from "utils/AxiosClient";

const Form = (props) => {
  const { data, setData, setIsOpened, media, setMedia } = props;
  const postsContext = useContext(PostsContext);
  const post = useContext(PostContext);
  const { _id: postId } = post;
  const { username: myUsername } = useSelector((state) => state.profile);

  const posts = postsContext?.posts;
  const setPosts = postsContext?.setPosts;

  const { username: currentPageUsername } = useParams();

  const dispatch = useDispatch();

  const MAX_TEXT = 40000;
  const MAX_LOCATION = 80;

  const trimmedText = (data.text || "").trim();
  const trimmedLocation = (data.location || "").trim();
  const canSubmit = trimmedText.length > 0 || media.length > 0;

  const textCharsLeft = useMemo(
    () => Math.max(0, MAX_TEXT - (data.text?.length || 0)),
    [data.text],
  );
  const locationCharsLeft = useMemo(
    () => Math.max(0, MAX_LOCATION - (data.location?.length || 0)),
    [data.location],
  );

  const submit = async () => {
    const formData = new FormData();
    const payload = {
      text: trimmedText.slice(0, MAX_TEXT),
      location: trimmedLocation.slice(0, MAX_LOCATION),
    };
    for (const property in payload) {
      formData.append(property, payload[property]);
    }
    if (media) {
      for (const file in media) {
        formData.append("media", media[file]);
      }
    }
    dispatch(
      setShowMessage({
        message: "Sharing...",
        type: "info",
      }),
    );
    axiosClient
      .post(`post/share?postId=${postId}`, formData)
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
        setMedia([]);
        setIsOpened(false);
      });
  };

  return (
    <div className="flex flex-col gap-2 sm:w-[560px] px-2 bg-[var(--bg-secondary)]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Share a Post</h2>
      </div>
      {/* Text Field */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium opacity-80" htmlFor="share-text">
          Say something about this
        </label>
        <div className="relative">
          <textarea
            id="share-text"
            value={data.text}
            maxLength={MAX_TEXT}
            className="w-full h-40 overflow-auto resize-none rounded-xl border-solid  border px-4 py-3 focus:border-[var(--primary-color)] text-sm leading-relaxed"
            dir="auto"
            name="text"
            placeholder="Share something..."
            onChange={(e) => {
              setData((prev) => ({ ...prev, text: e.target.value }));
            }}
          />
          <span className="absolute bottom-2 right-3 text-[10px] opacity-60">
            {textCharsLeft}
          </span>
        </div>
      </div>
      {/* Location Field */}
      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium opacity-80"
          htmlFor="share-location"
        >
          Location <span className="opacity-50 text-xs">(optional)</span>
        </label>
        <div className="relative">
          <input
            id="share-location"
            type="text"
            value={data.location || ""}
            maxLength={MAX_LOCATION}
            placeholder="e.g. New York, USA"
            className="w-full rounded-xl border-solid border px-4 py-2 focus:border-[var(--primary-color)]   text-sm"
            onChange={(e) =>
              setData((prev) => ({ ...prev, location: e.target.value }))
            }
          />
          <span className="absolute bottom-1 right-3 text-[10px] opacity-60">
            {locationCharsLeft}
          </span>
        </div>
      </div>
      {/* Media Uploader */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-medium opacity-70">
          <span>Photos / Videos</span>
          <span className="opacity-60">
            {media.length} file{media.length !== 1 && "s"}
          </span>
        </div>
        <DropZone files={media} setFiles={setMedia} />
      </div>
      {/* Actions */}
      <SubmitBtn disabled={!canSubmit} onClick={submit}>
        Share
      </SubmitBtn>

      {/* Original Post */}
      <div className="pt-2">
        <SharedPost post={post} />
      </div>
    </div>
  );
};

export default Form;
