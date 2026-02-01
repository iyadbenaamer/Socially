import TickIcon from "assets/icons/tick.svg?react";
import CrossIcon from "assets/icons/cross.svg?react";

const PasswordRules = ({ password }) => {
  const passwordChecks = {
    length: password.length >= 8,
    digit: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
  };

  const hasPasswordInput = password.length > 0;
  const passwordMetCount = Object.values(passwordChecks).filter(Boolean).length;
  const strengthPercent = hasPasswordInput
    ? Math.round((passwordMetCount / 5) * 100)
    : 0;
  const strengthLabel = !hasPasswordInput
    ? "Start typing to see strength"
    : passwordMetCount <= 2
    ? "Weak"
    : passwordMetCount <= 4
    ? "Medium"
    : "Strong";
  const strengthBarClass = !hasPasswordInput
    ? "bg-300"
    : passwordMetCount <= 2
    ? "bg-red-500"
    : passwordMetCount <= 4
    ? "bg-yellow-500"
    : "bg-green-500";
  const strengthTextClass = !hasPasswordInput
    ? "text-gray-500"
    : passwordMetCount <= 2
    ? "text-red-500"
    : passwordMetCount <= 4
    ? "text-yellow-600"
    : "text-green-600";

  const getRuleClasses = (isMet) => {
    if (!hasPasswordInput) {
      return { icon: "", text: "" };
    }
    if (isMet) {
      return { icon: "text-green-500", text: "text-green-600" };
    }
    return { icon: "text-red-500", text: "text-red-500" };
  };

  return (
    <div className="flex flex-col gap-2 bg-alt p-3 rounded-md shadow-md">
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span>Password strength</span>
        <span className={strengthTextClass}>{strengthLabel}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-200 overflow-hidden">
        <div
          className={`h-full transition-all duration-200 ${strengthBarClass}`}
          style={{ width: `${strengthPercent}%` }}
        />
      </div>
      <div className="text-xs sm:text-sm flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className={`w-5 ${getRuleClasses(passwordChecks.length).icon}`}>
            {passwordChecks.length ? <TickIcon /> : <CrossIcon />}
          </div>
          <span className={getRuleClasses(passwordChecks.length).text}>
            Length at least 8 characters
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-5 ${getRuleClasses(passwordChecks.digit).icon}`}>
            {passwordChecks.digit ? <TickIcon /> : <CrossIcon />}
          </div>
          <span className={getRuleClasses(passwordChecks.digit).text}>
            Contains at least 1 digit
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-5 ${getRuleClasses(passwordChecks.special).icon}`}>
            {passwordChecks.special ? <TickIcon /> : <CrossIcon />}
          </div>
          <span className={getRuleClasses(passwordChecks.special).text}>
            Contains at least 1 special character
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-5 ${getRuleClasses(passwordChecks.upper).icon}`}>
            {passwordChecks.upper ? <TickIcon /> : <CrossIcon />}
          </div>
          <span className={getRuleClasses(passwordChecks.upper).text}>
            Contains at least 1 uppercase letter
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-5 ${getRuleClasses(passwordChecks.lower).icon}`}>
            {passwordChecks.lower ? <TickIcon /> : <CrossIcon />}
          </div>
          <span className={getRuleClasses(passwordChecks.lower).text}>
            Contains at least 1 lowercase letter
          </span>
        </div>
      </div>
    </div>
  );
};

export default PasswordRules;
