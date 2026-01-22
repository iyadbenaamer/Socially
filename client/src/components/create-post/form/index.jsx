import { useContext, useState, useMemo } from "react";
import { useDispatch } from "react-redux";

import DropZone from "components/dropzone";
import axiosClient from "utils/AxiosClient";
import SubmitBtn from "components/SubmitBtn";

import { PostsContext } from "components/posts";
import { setShowMessage } from "state";

const Form = (props) => {
  const { data, setData, setIsOpened } = props;
  const { posts, setPosts } = useContext(PostsContext);
  const [media, setMedia] = useState([]);

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
    await axiosClient
      .post(`post/create`, formData)
      .then((response) => {
        if (posts) {
          setPosts([response.data, ...posts]);
        } else {
          setPosts(response.data);
        }
        dispatch(
          setShowMessage({
            message: "Post is published.",
            type: "info",
          }),
        );
      })
      .catch((err) => {
        dispatch(
          setShowMessage({
            message: err.response.data.message || "Failed to create post.",
            type: "error",
          }),
        );
      })
      .finally(() => {
        setData({ text: "", location: "" });
        setMedia([]);
        setIsOpened(false);
      });
  };

  return (
    <div className="flex flex-col gap-2 w-[320px] sm:w-[560px] px-2 bg-[var(--bg-secondary)] rounded-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Create a Post</h2>
      </div>
      {/* Text Field */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium opacity-80" htmlFor="post-text">
          What's on your mind?
        </label>
        <div className="relative">
          <textarea
            id="post-text"
            autoFocus
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
          htmlFor="post-location"
        >
          Location <span className="opacity-50 text-xs">(optional)</span>
        </label>
        <div className="relative">
          <input
            id="post-location"
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
          <span>Media</span>
          <span className="opacity-60">
            {media.length} file{media.length !== 1 && "s"}
          </span>
        </div>
        <DropZone files={media} setFiles={setMedia} />
      </div>
      {/* Actions */}
      <SubmitBtn disabled={!canSubmit} onClick={submit}>
        Post
      </SubmitBtn>
    </div>
  );
};

export default Form;
