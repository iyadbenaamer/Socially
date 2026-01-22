import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { clearSessionStorage, setResetPasswordInfo } from "state";

import Form from "./Form";

import LandingPic from "assets/login.svg?react";

const Login = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.settings.theme);
  // clear stored fields in signup and reset password pages
  dispatch(clearSessionStorage());
  dispatch(setResetPasswordInfo(null));

  return (
    <div className="min-h-[calc(100vh-45px)] flex">
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Socially
            </h1>
            <h2 className="text-2xl font-semibold">Welcome back!</h2>
            <p className="mt-2">
              Sign in to connect with friends and share your moments
            </p>
          </div>
          <div className={`bg-200 rounded-2xl shadow-xl py-8 px-4`}>
            <Form />
            <div
              className={`text-center mt-6 pt-6 border-t ${
                theme === "dark" ? "border-gray-700" : "border-gray-300"
              }`}
            >
              <p>
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-semibold text-primary hover:underline transition-colors"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 items-center justify-center ">
        <LandingPic className="w-full h-full" />
      </div>
    </div>
  );
};

export default Login;
