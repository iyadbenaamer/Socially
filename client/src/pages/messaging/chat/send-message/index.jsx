import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import axiosClient from "utils/AxiosClient";
import { socket } from "hooks/useHandleSocket";

import PhotoIcon from "assets/icons/photo.svg?react";
import AddCommentIcon from "assets/icons/create-comment.svg?react";
import CloseIcon from "assets/icons/cross.svg?react";

const SendMessage = () => {
  const { conversationId } = useParams();
  const { userId } = useParams();

  const [text, setText] = useState("");
  const [media, setMedia] = useState(null);
  const [replyTo, setReplyTo] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const textArea = useRef(null);
  const mediaBtn = useRef(null);

  const send = () => {
    const formData = new FormData();
    formData.append("text", text.trim());
    media && formData.append("media", media);
    textArea.current.value = "";

    if (userId) {
      axiosClient
        .post(`message/send_first_time?userId=${userId}`, formData)
        .catch((err) => {});
    }
    if (conversationId) {
      axiosClient
        .post(
          `message/send?conversationId=${conversationId}&replyTo=${replyTo}`,
          formData,
        )
        .catch((err) => {});
    }
  };

  const [file, setFile] = useState(null);

  useEffect(() => {
    if (socket && conversationId) {
      socket.emit("notify-typing", { conversationId, isTyping });
    }
  }, [isTyping, conversationId]);

  useEffect(() => {
    // this refocuses on the text area once the conversation changes
    textArea.current.focus();
    // this resets text once the conversation changes
    setText("");
  }, [conversationId, textArea.current]);

  return (
    <div className="py-3 flex flex-col gap-2">
      {file && (
        <div className="w-48 relative">
          <button
            className="w-5 absolute top-2 left-2"
            onClick={() => {
              setMedia(null);
              setFile(null);
            }}
          >
            <CloseIcon />
          </button>
          <div className="rounded-xl overflow-hidden">
            {media.type.startsWith("image") ? (
              <img src={file} alt="image" />
            ) : (
              <video src={file} />
            )}
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 bg-300 py-2 px-2 rounded-xl shadow-md">
        <textarea
          ref={textArea}
          autoFocus
          value={text}
          onKeyDown={(e) => {
            if (!text) {
              return;
            }
            if (e.key === "Enter" && !e.ctrlKey) {
              setIsTyping(false);
              send();
              setMedia(null);
              setFile(null);
              setText("");
            } else if (e.key === "Enter") {
              e.target.value += "\n";
            }
          }}
          dir="auto"
          className="comment-input h-6 w-4/5"
          placeholder={"Message"}
          onChange={(e) => {
            const input = e.target.value;
            if (input) {
              setIsTyping(true);
            }
            if (input.length > 100000) {
              return;
            }
            setText(input);
          }}
          onBlur={() => {
            setIsTyping(false);
          }}
        ></textarea>
        <div className="flex justify-end w-1/5">
          <input
            accept="video/*, video/x-m4v, video/webm, video/x-ms-wmv, video/x-msvideo, video/3gpp, video/flv, video/x-flv, video/mp4, video/quicktime, video/mpeg, video/ogv, .ts, .mkv, image/*, image/heic, image/heif"
            style={{ display: "none" }}
            type="file"
            ref={mediaBtn}
            onChange={(e) => {
              const reader = new FileReader();
              if (e.target.files[0]) {
                reader.readAsDataURL(e.target.files[0]);
                reader.addEventListener("load", (e) =>
                  setFile(e.currentTarget.result),
                );
                setMedia(e.target.files[0]);
              }
            }}
          />
          <button
            aria-label="add a photo or a video"
            className="w-7  circle p-[2px] outline-none text-hovered transition focus:[text-hovered]"
            onClick={() => mediaBtn.current.click()}
          >
            <PhotoIcon />
          </button>
          <button
            aria-label="send the comment"
            disabled={!(text || media)}
            className={`w-8 text-white stroke-white p-1 ${
              !(text || media) ? "icon opacity-30" : "icon-hover"
            }`}
            onClick={() => {
              setIsTyping(false);
              textArea.current?.focus();
              send();
              setMedia(null);
              setFile(null);
              setText("");
            }}
          >
            <AddCommentIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendMessage;
