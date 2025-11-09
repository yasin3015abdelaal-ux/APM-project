import PropTypes from "prop-types";

export default function Radio({
  label,
  onChange,
  value,
  error,
  helperText,
  ...props
}) {
  return (
    <label className="flex flex-row gap-2 ">
      {label && <p className="font-semibold ">{label}</p>}
      <div className="flex items-center gap-2">
        <input
          {...props}
          type={"radio"}
          className="peer appearance-none hidden"
          onChange={onChange}
          value={value}
        />
        <div className="w-5 h-5 rounded-full border border-main flex before:w-3 before:h-3 before:bg-main before:rounded-full  peer-checked:before:opacity-100 before:opacity-0 before:transition-opacity items-center justify-center"></div>
      </div>
      <p className={`ps-2 ${error ? "text-red-600" : "black"}`}>{helperText}</p>
    </label>
  );
}

Radio.propTypes = {
  error: PropTypes.bool,
  helperText: PropTypes.string,
};
