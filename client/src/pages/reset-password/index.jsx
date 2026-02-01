import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import VerifyCode from "./VerifyCode.jsx";
import SendCode from "./SendCode.jsx";
import CreateNewPassword from "./CreateNewPassword.jsx";
import Alert from "components/alert/index.jsx";

import { setResetPasswordInfo } from "state/index.js";
import axiosClient from "utils/AxiosClient.js";

const ResetPassword = () => {
  const { isCodeSent, token, message, email } = useSelector(
    (state) => state.resetPasswordInfo,
  );
  const [alert, setAlert] = useState({ type: "error", isOpen: false });
  const setIsAlertOpen = (isOpen) => setAlert((prev) => ({ ...prev, isOpen }));
  const theme = useSelector((state) => state.settings.theme);
  const dispatch = useDispatch();
  const { token: tokenParam } = useParams();

  // Clear any existing reset password state when component mounts
  useEffect(() => {
    dispatch(
      setResetPasswordInfo({
        email: null,
        token: null,
        message: "",
        isCodeSent: false,
        isPasswordReset: false,
      }),
    );
  }, []);

  /*
  password reset can also be performed by a token rather than a verification code
  if the token is exist, the request the endpoint by this token and this endpoint
  returns the token that entitles the user to reset the password, otherwise the user have 
  to reset the password by the verification code that was sent to their email.
  */
  useEffect(() => {
    if (tokenParam) {
      axiosClient(`verify_reset_password?token=${tokenParam}`)
        .then((response) => {
          const { token } = response.data;
          dispatch(
            setResetPasswordInfo({
              token,
              isCodeSent: false, // Don't set isCodeSent when using direct token
              message: "",
            }),
          );
        })
        .catch((error) => {
          const { message } = error.response?.data || {};
          dispatch(
            setResetPasswordInfo({
              message,
              isCodeSent: false,
              token: null,
            }),
          );
        });
    }
  }, [tokenParam]);

  useEffect(() => {
    if (!alert.isOpen) {
      // reset message when alert is closed
      dispatch(setResetPasswordInfo({ message: "" }));
    }
  }, [alert.isOpen]);

  useEffect(() => {
    if (message) {
      // Determine alert type based on message content
      let alertType = "error";
      if (message.includes("successfully") || message.includes("sent")) {
        alertType = "success";
      } else if (message.includes("expired") || message.includes("invalid")) {
        alertType = "warning";
      }

      // open the alert when message is set
      setAlert((prev) => ({
        ...prev,
        type: alertType,
        isOpen: true,
      }));
    } else {
      setAlert((prev) => ({ ...prev, isOpen: false }));
    }
  }, [message]);

  // Determine which component to show based on current state
  const renderComponent = () => {
    if (token) {
      return <CreateNewPassword />;
    }

    if (isCodeSent && email) {
      return <VerifyCode />;
    }

    return <SendCode />;
  };

  return (
    <div className="container flex flex-col p-3">
      <Alert
        isOpened={alert.isOpen}
        setIsOpened={setIsAlertOpen}
        type={alert.type}
        message={message}
        position="top-center"
        autoDismiss={true}
        dismissTime={6000}
      />

      <div
        className={`${
          theme === "light" ? "text-slate-800" : ""
        } my-8 bg-300 rounded-xl p-4 shadow-md flex flex-col gap-2 max-w-xl w-full self-center`}
      >
        {renderComponent()}
      </div>
    </div>
  );
};

export default ResetPassword;
