import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { clearSessionStorage, setAuthStatus, setProfile } from "state/index.js";

import axiosClient from "utils/AxiosClient.js";

import TickIcon from "assets/icons/tick.svg?react";
import InfoIcon from "assets/icons/info.svg?react";
import RedCrossIcon from "assets/icons/red-cross.svg?react";

const VerifyAccountByLink = () => {
  const { isVerified } = useSelector((state) => state.authStatus);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);
  const dispatch = useDispatch();
  dispatch(clearSessionStorage());
  const { token } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    if (token) {
      setIsLoading(true);
      axiosClient(`/verify_account?token=${token}`)
        .then((response) => {
          const { token, profile, email } = response.data;
          localStorage.setItem("token", token);
          dispatch(setProfile(profile));
          dispatch(
            setAuthStatus({
              message: "",
              isLoggedin: true,
              token,
              isVerified: true,
              email: email,
            }),
          );
          setIsLoading(false);
        })
        .catch((error) => {
          const { alreadyVerified } = error.response?.data || {};
          if (alreadyVerified) {
            setMessage("Your account is already verified.");
            setIsAlreadyVerified(true);
            setTimeout(() => {
              navigate("/login");
            }, 3000);
          } else {
            setMessage(
              "Invalid or expired verification link. Please try again.",
            );
            setIsError(true);
          }
          setIsLoading(false);
        });
    }
  }, []);

  if (isVerified) {
    return <Navigate to={"/welcome"} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-100">
        <div className="text-center">
          <div className="animate-spin circle h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Verifying your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-300 rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="mb-6">
            {isAlreadyVerified ? (
              <div className="mx-auto w-20 h-20 bg-yellow-100 circle flex items-center justify-center">
                <InfoIcon className="w-10 h-10 text-yellow-600" />
              </div>
            ) : isError ? (
              <div className="mx-auto w-20 h-20 bg-red-100 circle flex items-center justify-center">
                <RedCrossIcon className="w-10 h-10" />
              </div>
            ) : (
              <div className="mx-auto w-20 h-20 bg-green-100 circle flex items-center justify-center">
                <TickIcon className="w-10 h-10" />
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold  mb-4">
            {isAlreadyVerified
              ? "Account Already Verified"
              : isError
              ? "Verification Failed"
              : "Account Verified Successfully"}
          </h1>

          {/* Message */}
          <p className=" mb-6 leading-relaxed">{message}</p>

          {/* Additional info for already verified */}
          {isAlreadyVerified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                You will be redirected to the login page in a few seconds.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            {isError && (
              <button
                onClick={() => (window.location.href = "/login")}
                className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Go to Login
              </button>
            )}

            {isAlreadyVerified && (
              <div className="text-sm ">Redirecting to login...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyAccountByLink;
