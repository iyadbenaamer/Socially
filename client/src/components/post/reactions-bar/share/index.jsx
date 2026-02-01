import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";

import Form from "./Form";
import Dialog from "components/dialog";

import ShareIcon from "assets/icons/share.svg?react";

const Share = () => {
  const navigate = useNavigate();
  const profile = useSelector((state) => state.profile);

  const [data, setData] = useState({ text: "", location: "" });
  const [media, setMedia] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const isOpened = searchParams.get("dialog") === "share";

  const setShareDialog = (open, replace = true) =>
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (open) {
          sp.set("dialog", "share");
        } else {
          sp.delete("dialog");
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
