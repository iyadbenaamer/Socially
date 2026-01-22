import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import Form from "./Form";
import Dialog from "components/dialog";

import ShareIcon from "assets/icons/share.svg?react";

const Share = () => {
  const navigate = useNavigate();
  const profile = useSelector((state) => state.profile);

  const [data, setData] = useState({ text: "", location: "" });
  const [media, setMedia] = useState([]);
  const [isOpened, setIsOpened] = useState(false);

  return (
    <>
      <button
        className="flex w-auto justify-center gap-1 items-center hover:text-[var(--primary-color)] transition"
        onClick={() => {
          if (profile) {
            setIsOpened(true);
          } else {
            navigate("/login");
          }
        }}
      >
        <div className="w-6">
          <ShareIcon />
        </div>
      </button>
      <Dialog isOpened={isOpened} setIsOpened={setIsOpened}>
        <Form
          setIsOpened={setIsOpened}
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
