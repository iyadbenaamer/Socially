import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import PrimaryBtn from "./PrimaryBtn";
import SubmitBtn from "./SubmitBtn";

import axiosClient from "utils/AxiosClient";
import { setShowMessage } from "state";

const Text = (props) => {
  const {
    type,
    postCreatorId,
    postId,
    commentId,
    replyId,
    isModifying,
    setIsModifying,
  } = props;
  const profile = useSelector((state) => state.profile);

  const [text, setText] = useState("");
  const [modifiedText, setModifiedText] = useState(props.text);
  const [originalText, setOriginalText] = useState(props.text);

  const dispatch = useDispatch();
  const textArea = useRef(null);

  const editText = async () => {
    let requestUrl;
    if (type === "post") {
      requestUrl = `post/edit?userId=${postCreatorId}&postId=${postId}`;
    } else if (type === "comment") {
      requestUrl = `comment/edit?userId=${postCreatorId}&postId=${postId}&commentId=${commentId}`;
    } else if (type === "reply") {
      requestUrl = `reply/edit?userId=${postCreatorId}&postId=${postId}&commentId=${commentId}&replyId=${replyId}`;
    }

    await axiosClient
      .patch(
        requestUrl,
        { text: modifiedText.trim() },
        { headers: { Authorization: profile.token } }
      )
      .then((response) => {
        setOriginalText(response.data.text);
      })
      .catch((err) => {
        if (err.response) {
          dispatch(
            setShowMessage({
              message:
                err.response?.data?.message || "You cannot edit this text.",
              type: "error",
            })
          );
        } else {
          dispatch(
            setShowMessage({
              message: "An error occurred. Please try again later.",
              type: "error",
            })
          );
        }
      })
      .finally(() => {
        setModifiedText(modifiedText.trim());
        setIsModifying(false);
      });
  };

  useEffect(() => {
    let text = originalText;
    if (text.length > 100) {
      setText(text.slice(0, 100).concat(" ..."));
    } else {
      setText(text);
    }
  }, [isModifying]);

  return (
    <>
      {isModifying ? (
        <>
          <textarea
            autoFocus
            ref={textArea}
            dir="auto"
            value={modifiedText}
            onChange={(e) => {
              const text = e.target.value;
              if (text.length <= 40000 && type == "post") {
                setModifiedText(text);
              } else if (text.length <= 10000 && type !== "post") {
                setModifiedText(text);
              }
            }}
          ></textarea>
          <div className="self-end flex gap-3">
            <span>
              <PrimaryBtn onClick={() => setIsModifying(false)}>
                Cancel
              </PrimaryBtn>
            </span>
            <span>
              <SubmitBtn
                disabled={!modifiedText || modifiedText === originalText}
                onClick={editText}
              >
                Edit
              </SubmitBtn>
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-col">
          <pre
            dir="auto"
            className="font-[inherit] text-ellipsis text-wrap break-words"
          >
            {text}
          </pre>
          {text.length > 100 && originalText.length !== text.length && (
            <button
              className="link w-fit"
              onClick={() => setText(originalText)}
            >
              show more
            </button>
          )}
          {text.length > 100 && text.length === originalText.length && (
            <button
              className="link w-fit"
              onClick={() => setText(originalText.slice(0, 100).concat(" ..."))}
            >
              show less
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default Text;
