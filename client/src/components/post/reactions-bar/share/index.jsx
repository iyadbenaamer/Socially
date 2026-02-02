import { useContext, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";

import Form from "./Form";
import Dialog from "components/dialog";

import ShareIcon from "assets/icons/share.svg?react";
import { PostContext } from "components/post";

const Share = () => {
  const navigate = useNavigate();
  const profile = useSelector((state) => state.profile);
  const post = useContext(PostContext);

  const [data, setData] = useState({ text: "", location: "" });
  const [media, setMedia] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const isOpened =
    searchParams.get("dialog") === "share" &&
    searchParams.get("postId") === post._id;

  const setShareDialog = (open, replace = true) =>
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (open) {
          sp.set("dialog", "share");
          sp.set("postId", post._id);
        } else {
          sp.delete("dialog");
          sp.delete("postId");
        }
        return sp;
      },
      { replace },
    );

  return (
    <>
      <button
        className="flex w-auto justify-center gap-1 items-center hover:text-[var(--primary-color)] transition"
        onClick={() => {
          if (profile) {
            setShareDialog(!isOpened, isOpened);
          } else {
            navigate("/login");
          }
        }}
      >
        <div className="w-6">
          <ShareIcon />
        </div>
      </button>
      <Dialog
        title="Share"
        preventClickOutside
        isOpened={isOpened}
        setIsOpened={(next) => setShareDialog(next, true)}
      >
        <Form
          setIsOpened={(next) => setShareDialog(next, true)}
          data={data}
          setData={setData}
          media={media}
          setMedia={setMedia}
        />
      </Dialog>
    </>
  );
};
export default Share;
