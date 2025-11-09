import PropTypes from "prop-types";
export default function TextField({
  label,
  startIcon,
  endIcon,
  rows,
  onChange,
  value,
  error,
  helperText,
  ...props
}) {
  return (
    <label className="flex flex-col gap-2 ">
      {label && <p className="font-semibold text-3xl mb-2">{label}</p>}
      <div className={`flex items-center justify-between ${error ? "border-red-600": "border-main"} border py-1 px-3 rounded-lg gap-2`}>
        {startIcon && startIcon}
        {rows ? (
          <textarea
            className="focus:outline-none appearance-none  caret-main placeholder:text-main/60 flex-1 mt-3"
            onChange={onChange}
            {...props}
            rows={rows}
          >
            {value || ""}
          </textarea>
        ) : (
          <input
            type={props.type || "text"}
            className="focus:outline-none appearance-none  caret-main placeholder:text-main/60 flex-1"
            onChange={onChange}
            value={value}
            {...props}
          />
        )}
        {endIcon && endIcon}
      </div>
      <p className={`ps-2 ${error ? "text-red-600" : "black"}`}>
        {helperText}
      </p>
    </label>
  );
}

TextField.propTypes = {
  error: PropTypes.bool,
  helperText: PropTypes.string,
};
