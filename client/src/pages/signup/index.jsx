import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, useNavigate } from "react-router-dom";

import Form from "./form";
import { setResetPasswordInfo } from "state";

const Signup = () => {
  const [isSignedup, setIsSignedup] = useState(false);
  const theme = useSelector((state) => state.settings.theme);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // clear stored fields in reset page
  dispatch(setResetPasswordInfo(null));

  if (isSignedup) navigate("/verify-account");

  return (
    <div className="container p-4 m-auto">
      <div
        className={`auth flex flex-col gap-3 p-4 max-w-3xl mx-auto shadow-md rounded-xl bg-300 ${
          theme === "light" ? "border" : ""
        }`}
      >
        <h2 className="text-2xl font-bold">Sign up</h2>
        <Form setIsSignup={setIsSignedup} />
        <div>
          Already have an account?{" "}
          <Link
            tabIndex={1}
            to="/login"
            className=" hover:underline hover:text-[var(--primary-color)]"
          >
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
};
export default Signup;
