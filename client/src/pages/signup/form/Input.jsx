import { useEffect, useRef, useState } from "react";
import Lottie from "react-lottie";

import tickAnimationData from "assets/icons/tick.json";
import crossAnimationData from "assets/icons/cross.json";

const Input = (props) => {
  const {
    name,
    label,
    fieldValue,
    autoFocus,
    setData,
    setIsValid,
    placeholder,
  } = props;
  const regex =
    /.[^!|@|#|$|%|^|&|*|(|)|_|-|=|+|<|>|/|\\|'|"|:|;|[|]|\{|\}]{2,}/gi;

  const [check, setCheck] = useState({ state: "", message: "" });
  const [focused, setFocused] = useState(autoFocus);
  const [changed, setChanged] = useState(false);

  const input = useRef(null);

  const verifyValue = () => {
    if (!fieldValue) {
      input.current.style.border = "solid 2px red";
      setData((prev) => ({ ...prev, [name]: fieldValue }));
      setCheck({ state: "fail", message: "Required" });
      return;
    }

    const isValid = regex.test(fieldValue);
    if (isValid) {
      input.current.style.border = "solid 2px green";
      setData((prev) => ({
        ...prev,
        [name]: fieldValue.trim(),
      }));
      setCheck({ state: "success" });
      return;
    }

    if (!isValid) {
      input.current.style.border = "solid 2px red";
      setData((prev) => ({ ...prev, [name]: fieldValue }));
      setCheck({
        state: "fail",
        message: `Invalid ${label.toLowerCase()}`,
      });
    }
  };

  useEffect(() => {
    setIsValid(check.state === "success" ? true : false);
  }, [check]);

  useEffect(() => {
    if (!focused && fieldValue && input.current) {
      verifyValue(input.current);
    }
  }, [fieldValue]);

  return (
    <>
      <label htmlFor={name}>{label}</label>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          name={name}
          tabIndex={1}
          ref={input}
          defaultValue={fieldValue}
          placeholder={placeholder}
          style={{
            borderRadius: 8,
            boxShadow: "0px 1px 3px 0px #00000026",
            border: "solid 2px transparent",
          }}
          className="p-[4px] bg-200"
          autoFocus={autoFocus}
          onFocus={(e) => {
            e.target.style.border = "solid 2px transparent";
            setFocused(true);
            if (!changed) {
              setChanged(true);
            }
          }}
          onChange={(e) => {
            const value = e.target.value.trim();
            setData((prev) => ({ ...prev, [name]: value }));
            window.sessionStorage.setItem([e.target.name], value);
            if (!focused && changed) {
              verifyValue(e.target);
            }
          }}
          onBlur={(e) => {
            verifyValue(e.target);
            setFocused(false);
          }}
        />
        <div className="w-10">
          {!focused && (
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
          )}
        </div>
      </div>

      <div
        className={`${
          check.state === "fail" ? "text-[red]" : "text-[green]"
        } h-7 text-xs`}
      >
        {!focused && check.message}
      </div>
    </>
  );
};

export default Input;
