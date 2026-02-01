import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { setAuthStatus, setProfile, setResetPasswordInfo } from "state";

import PasswordInput from "components/PasswordInput";
import SubmitBtn from "components/SubmitBtn";
import PasswordRules from "../signup/form/PasswordRules";

import axiosClient from "utils/AxiosClient";
import { Link } from "react-router-dom";

const CreateNewPassword = () => {
  const { token, isPasswordReset } = useSelector(
    (state) => state.resetPasswordInfo,
  );
  const [isValidInputs, setIsValidInputs] = useState({
    password: false,
    confirmPassword: false,
  });
  const [data, setData] = useState({ password: "" });
  const dispatch = useDispatch();
  const [authInfo, setAuthInfo] = useState({});
  const [loading, setLoading] = useState(false);

  const isDisabled = () => {
    for (const key in isValidInputs) {
      if (!isValidInputs[key]) {
        return true;
      }
    }
    return false;
  };

  const resetPassword = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.post(`reset_password/${token}`, {
        password: data.password,
      });
      setAuthInfo(response.data);
      dispatch(setResetPasswordInfo({ isPasswordReset: true }));
    } catch (error) {
      const { message, isExpired } = error.response?.data || {};
      if (isExpired) {
        /*
        if token is expired then all reset password information will be reset
        which will redirect back to search account wizard
        */
        dispatch(
          setResetPasswordInfo({
            isCodeSent: false,
            token: null,
            email: null,
            message: "Your reset link has expired. Please request a new one.",
          }),
        );
      } else {
        dispatch(setResetPasswordInfo({ message }));
      }
    } finally {
      setLoading(false);
    }
  };

  const authenticateAfterReset = () => {
    const { profile, isVerified, token } = authInfo;
    localStorage.setItem("token", token);
    dispatch(setAuthStatus({ isVerified, email: "", isLoggedin: true }));
    dispatch(setProfile(profile));
    dispatch(setResetPasswordInfo(null));
  };

  return (
    <>
      {!isPasswordReset && (
        <>
          <h1 className="font-bold text-2xl text-primary">
            Enter new password
          </h1>
          <PasswordInput
            setIsValid={(isValid) =>
              setIsValidInputs({ ...isValidInputs, password: isValid })
            }
            data={data}
            setData={setData}
            name={"password"}
            fieldValue={data.password}
            placeholder={"New password"}
          />
          <PasswordRules password={data.password} />
          <PasswordInput
            setIsValid={(isValid) =>
              setIsValidInputs({ ...isValidInputs, confirmPassword: isValid })
            }
            data={data}
            setData={setData}
            name={"confirmPassword"}
            fieldValue={data.confirmPassword}
            placeholder={"Confirm new password"}
          />
          <SubmitBtn
            disabled={isDisabled() || loading}
            tabIndex={1}
            onClick={resetPassword}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </SubmitBtn>
        </>
      )}
      {isPasswordReset && (
        <div className="flex flex-col gap-6">
          <h1 className="text-lg">
            Your password has been reset successfully!
          </h1>
          <Link
            className="w-full rounded-xl bg-primary p-2 text-center text-white"
            to="/"
            onClick={authenticateAfterReset}
          >
            Go to home page
          </Link>
        </div>
      )}
    </>
  );
};

export default CreateNewPassword;
