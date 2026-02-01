import { useState } from "react";
import { useSelector } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";

import Dialog from "components/dialog";
import Form from "./form";

import AddIcon from "assets/icons/edit.svg?react";

const CreatePost = () => {
  const profile = useSelector((state) => state.profile);

  const [searchParams, setSearchParams] = useSearchParams();
  const isOpened = searchParams.get("dialog") === "create-post";
  const [data, setData] = useState({ text: "", location: "" });

  const setCreatePostDialog = (open, replace = true) =>
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (open) {
          sp.set("dialog", "create-post");
        } else {
          sp.delete("dialog");
        }
        return sp;
      },
      { replace },
    );

  const { username: usernameParam } = useParams();

  const theme = useSelector((state) => state.settings.theme);

  /* the component will be rendered only on home page and the user's profile */
  if (usernameParam && profile?.username !== usernameParam) return;

  return (
    <>
      <button
        onClick={() => setCreatePostDialog(!isOpened, isOpened)}
        className="create-post bg-primary p-2 rounded-3xl shadow-md z-[1000] fixed right-3 sm:right-16 bottom-14 sm:bottom-14 w-12 sm:w-14"
      >
        <AddIcon className="text-white" />
      </button>
      <Dialog
        title="Create Post"
        isOpened={isOpened}
        setIsOpened={(next) => setCreatePostDialog(next, true)}
        preventClickOutside={true}
      >
        <Form
          setIsOpened={(next) => setCreatePostDialog(next, true)}
          data={data}
          setData={setData}
        />
      </Dialog>
    </>
  );
};

export default CreatePost;
