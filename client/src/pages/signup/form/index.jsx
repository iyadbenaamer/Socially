import { useState } from "react";
import { useDispatch } from "react-redux";
import { setAuthStatus } from "state";

import DateInput from "./DateInput";
import Alert from "components/alert";
import SubmitBtn from "components/SubmitBtn";
import PasswordInput from "components/PasswordInput";
import Input from "./Input";
import EmailInput from "components/EmailInput";
import PasswordRules from "./PasswordRules";

import axiosClient from "utils/AxiosClient";

const Form = (props) => {
  const { setIsSignup } = props;
  const dispatch = useDispatch();
  const [message, setMessage] = useState("");
  const [isAlertOpened, setIsAlertOpened] = useState(false);
  const [data, setData] = useState({
    firstName: sessionStorage.getItem("firstName") ?? "",
    lastName: sessionStorage.getItem("lastName") ?? "",
    email: sessionStorage.getItem("email") ?? "",
    password: sessionStorage.getItem("password") ?? "",
    birthDate: sessionStorage.getItem("birthDate") ?? "",
    gender: sessionStorage.getItem("gender") ?? "male",
  });
  const [isValidInputs, setIsValidInputs] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const handleChange = (e) => {
    window.sessionStorage.setItem([e.target.name], e.target.value);
    setData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const isDisabled = () => {
    for (const key in isValidInputs) {
      if (!isValidInputs[key]) {
        return true;
      }
    }
    return false;
  };

  const submit = async () => {
    await axiosClient
      .post(`signup`, data)
      .then(() => {
        dispatch(setAuthStatus({ email: data.email, isLoggedin: true }));
        setIsSignup(true);
      })
      .catch((error) => {
        setMessage(error.response.data.message);
        setIsSignup(false);
      });
    setIsAlertOpened(true);
  };

  return (
    <>
      {isAlertOpened && (
        <div>
          <Alert
            type={"error"}
            message={message}
            isOpened={isAlertOpened}
            setIsOpened={setIsAlertOpened}
          />
        </div>
      )}
      <section className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="col-span-1">
            <Input
              setIsValid={(isValid) =>
                setIsValidInputs((prev) => ({ ...prev, firstName: isValid }))
              }
              fieldValue={data.firstName}
              name={"firstName"}
              label={"First Name"}
              placeholder={"John"}
              autoFocus
              setData={setData}
            />
          </div>
          <div className="col-span-1">
            <Input
              setIsValid={(isValid) =>
                setIsValidInputs((prev) => ({ ...prev, lastName: isValid }))
              }
              fieldValue={data.lastName}
              name={"lastName"}
              label={"Last Name"}
              placeholder={"Doe"}
              setData={setData}
            />
          </div>
          <div className="col-span-1">
            <EmailInput
              type="register"
              setIsValid={(isValid) =>
                setIsValidInputs((prev) => ({ ...prev, email: isValid }))
              }
              fieldValue={data.email}
              setData={setData}
            />
          </div>
          <div className="col-span-1"></div>
          <div className="col-span-1 ">
            <PasswordInput
              setIsValid={(isValid) =>
                setIsValidInputs((prev) => ({ ...prev, password: isValid }))
              }
              data={data}
              setData={setData}
              name={"password"}
              fieldValue={data.password}
              placeholder={"Password"}
            />
            <PasswordRules password={data.password} />
          </div>
          <div className="col-span-1 ">
            <PasswordInput
              setIsValid={(isValid) =>
                setIsValidInputs((prev) => ({
                  ...prev,
                  confirmPassword: isValid,
                }))
              }
              data={data}
              setData={setData}
              name={"confirmPassword"}
              placeholder={"Confirm Password"}
            />
          </div>
          <div className="col-span-1">
            <label className="block">Birthdate</label>
            <DateInput setData={setData} />
          </div>
          <div className="col-span-1">
            <label className="block" htmlFor="gender">
              Gender
            </label>
            <select tabIndex={1} name="gender" onChange={handleChange}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className=" self-center">
          <SubmitBtn
            tabIndex={1}
            disabled={isDisabled()}
            onClick={async () => await submit()}
          >
            Sign up
          </SubmitBtn>
        </div>
      </section>
    </>
  );
};
export default Form;
