import { useEffect, useRef, useState } from "react";
import Lottie from "react-lottie";

import axiosClient from "utils/AxiosClient";

import tickAnimationData from "assets/icons/tick.json";
import crossAnimationData from "assets/icons/cross.json";
import LoadingIcon from "assets/icons/loading-circle.svg?react";
import { useSelector } from "react-redux";

const UsernameInput = (props) => {
  const { fieldValue, setData, setIsValid } = props;
  const [check, setCheck] = useState({ state: "", message: "" });
  const profile = useSelector((state) => state.profile);
  const input = useRef(null);

  /*
  input may have a value stored in the session storage, 
  so we need to verify that value once the component is loaded for the first time.
  */
  useEffect(() => {
    if (fieldValue) {
      verifyValue();
    }
    setIsValid(check.state === "success" ? true : false);
  }, []);

  // set isValid whenever "check" is changed
  useEffect(
    () => setIsValid(check.state === "success" ? true : false),
    [check],
  );
  const [focused, setFocused] = useState(false);
  const [isUsernameChecked, setIsUsernameChecked] = useState(false);

  const verifyValue = () => {
    setData((prev) => ({
      ...prev,
      username: fieldValue.trim().toLowerCase(),
    }));
    if (!fieldValue) {
      setIsUsernameChecked(true);
      input.current.style.border = "solid 2px red";
      setCheck({ state: "fail", message: "Required" });
      return;
    }
    const isValid = /^\w+$/gi.test(fieldValue);
    if (isValid && fieldValue.length <= 20) {
      axiosClient
        .post(`profile/check_username_availability`, {
          username: fieldValue,
        })
        .then((response) => {
          const { message } = response.data;
          input.current.style.border = "solid 2px green";
          setCheck({
            state: "success",
            message,
          });
          setIsUsernameChecked(true);
        })
        .catch((error) => {
          setCheck({ state: "fail", message: error.response.data.message });
          input.current.style.border = "solid 2px red";
          setIsUsernameChecked(true);
        });
      return;
    }
    input.current.style.border = "solid 2px red";
    if (isValid && fieldValue.length > 20) {
      setIsUsernameChecked(true);
      setCheck({
        state: "fail",
        message: "Username is too large.",
      });
      return;
    }
    if (!isValid) {
      setIsUsernameChecked(true);
      setCheck({
        state: "fail",
        message: "Invalid username",
      });
    }
  };

  return (
    <div>
      <label htmlFor="username">Username</label>
      <div className="flex gap-1 items-center">
        @
        <input
          autoFocus
          ref={input}
          defaultValue={fieldValue}
          placeholder={"username"}
          style={{
            borderRadius: 8,
            boxShadow: "0px 1px 3px 0px #00000026",
            border: "solid 2px transparent",
          }}
          className="p-1 bg-200"
          onFocus={(e) => {
            e.target.style.border = "solid 2px transparent";
            setIsUsernameChecked(false);
            setFocused(true);
          }}
          onChange={(e) => {
            const value = e.target.value.trim().toLowerCase();
            setData((prev) => ({ ...prev, username: value }));
            window.sessionStorage.setItem("username", value);
          }}
          onBlur={() => {
            verifyValue();
            setFocused(false);
          }}
          type="text"
          name="username"
        />
        <div className="w-10">
          {!focused &&
            fieldValue !== profile.username &&
            (!isUsernameChecked ? (
              <LoadingIcon />
            ) : (
              <>
                {check.state === "fail" ? (
                  <Lottie
                    width={36}
                    height={36}
                    options={{
                      loop: false,
                      autoplay: true,
                      animationData: crossAnimationData,
                      rendererSettings: {
                        preserveAspectRatio: "xMidYMid slice",
                      },
                    }}
                  />
                ) : check.state === "success" ? (
                  <Lottie
                    width={24}
                    height={24}
                    options={{
                      loop: false,
                      autoplay: true,
                      animationData: tickAnimationData,
                      rendererSettings: {
                        preserveAspectRatio: "xMidYMid slice",
                      },
                    }}
                  />
                ) : (
                  ""
                )}
              </>
            ))}
        </div>
      </div>
      <div className="flex justify-between text-sm ms-6 mt-1 h-7">
        <div
          className={`${
            check.state === "fail" ? "text-red-500" : "text-green-500"
          }`}
        >
          {!focused && isUsernameChecked && check.message}
        </div>
        <div>{fieldValue.length}/20</div>
      </div>
    </div>
  );
};

export default UsernameInput;
