import { useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import Dialog from "components/dialog";
import Form from "./form";

import AddIcon from "assets/icons/edit.svg?react";

const CreatePost = () => {
  const profile = useSelector((state) => state.profile);

  const [isOpened, setIsOpened] = useState(false);
  const [data, setData] = useState({ text: "", location: "" });

  const { username: usernameParam } = useParams();

  const theme = useSelector((state) => state.settings.theme);

  /* the component will be rendered only on home page and the user's profile */
  if (usernameParam && profile?.username !== usernameParam) return;

  return (
    <div>
      <button
        onClick={() => setIsOpened(true)}
        className="create-post bg-primary p-2 rounded-3xl shadow-md z-[1000] fixed right-3 sm:right-16 bottom-20 sm:bottom-16 w-12 sm:w-14"
      >
        <AddIcon className="text-white" />
      </button>
      <Dialog
        isOpened={isOpened}
        setIsOpened={setIsOpened}
        preventClickOutside={true}
      >
        <Form setIsOpened={setIsOpened} data={data} setData={setData} />
      </Dialog>
    </div>
  );
};

export default CreatePost;
