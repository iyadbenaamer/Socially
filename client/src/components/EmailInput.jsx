import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import Lottie from "react-lottie";

import axiosClient from "utils/AxiosClient";
import { setShowMessage } from "state";

import tickAnimationData from "assets/icons/tick.json";
import crossAnimationData from "assets/icons/cross.json";
import LoadingIcon from "assets/icons/loading-circle.svg?react";

const EmailInput = (props) => {
  const { fieldValue, setData, setIsValid, type, placeholder } = props;
  const regex = /((\w)+.?)+@\w{1,}\.\w{2,}/gi;

  const [check, setCheck] = useState({ state: "", message: "" });
  const [focused, setFocused] = useState(false);
  const [changed, setChanged] = useState(false);
  const [isEmailChecked, setIsEmailChecked] = useState(false);

  const input = useRef(null);
  const dispatch = useDispatch();
  const verifyValue = () => {
    if (!fieldValue) {
      input.current.style.border = "solid 2px red";
      setData((prev) => ({ ...prev, email: fieldValue }));
      setIsEmailChecked(true);
      setCheck({ state: "fail", message: "Required" });
      return;
    }
    const isValid = regex.test(fieldValue);
    if (isValid) {
      setData((prev) => ({
        ...prev,
        email: fieldValue.trim().toLowerCase(),
      }));

      // Clear previous validation state before making new request
      setCheck({ state: "", message: "" });
      setIsEmailChecked(false);

      // checking of email availability
      axiosClient(`check_email_availability/${type}/${fieldValue}`)
        .then((response) => {
          const { message, success } = response.data;
          if (success) {
            input.current.style.border = "solid 2px green";
            setCheck({
              state: "success",
              message,
            });
          } else {
            input.current.style.border = "solid 2px red";
            setCheck({ state: "fail", message: response.data.message });
          }
        })
        .catch(() => {
          dispatch(
            setShowMessage({
              message: "An error occurred. Plaese try again later.",
              type: "error",
            }),
          );
        })
        .finally(() => {
          setIsEmailChecked(true);
        });
      return;
    }
    if (!isValid) {
      input.current.style.border = "solid 2px red";
      setData((prev) => ({ ...prev, email: fieldValue }));
      setIsEmailChecked(true);
      setCheck({
        state: "fail",
        message: "Invalid email",
      });
    }
  };

  useEffect(
    () => setIsValid(check.state === "success" ? true : false),
    [check],
  );

  useEffect(() => {
    if (!focused && fieldValue && input.current) {
      verifyValue(input.current);
    }
  }, [fieldValue]);

  return (
    <>
      <label htmlFor="email">Email</label>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          name="email"
          tabIndex={1}
          ref={input}
          defaultValue={fieldValue}
          placeholder={!placeholder ? "email.example.com" : ""}
          style={{
            borderRadius: 8,
            boxShadow: "0px 1px 3px 0px #00000026",
            border: "solid 2px transparent",
          }}
          className="p-[4px] bg-200"
          onFocus={(e) => {
            e.target.style.border = "solid 2px transparent";
            setIsEmailChecked(false);
            setFocused(true);
            if (!changed) {
              setChanged(true);
            }
          }}
          onChange={(e) => {
            const value = e.target.value.trim();
            setData((prev) => ({ ...prev, email: value }));
            window.sessionStorage.setItem("email", value);

            // Clear previous validation state when user types
            if (check.state !== "" || check.message !== "") {
              setCheck({ state: "", message: "" });
              setIsEmailChecked(false);
            }

            if (!focused && changed) {
              verifyValue(e.target);
            }
          }}
          onBlur={() => {
            verifyValue();
            setFocused(false);
          }}
        />
        <div className="w-10">
          {!focused &&
            fieldValue &&
            (!isEmailChecked ? (
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
      <div
        className={`${
          check.state === "fail" ? "text-[red]" : "text-[green]"
        } h-7`}
      >
        {!focused && check.message}
      </div>
    </>
  );
};

export default EmailInput;
