import PropTypes from "prop-types";
import Radio from "../Radio/Radio";
import { useState } from "react";

export default function RadioGroup({
  label,
  onChange,
  value,
  error,
  radios,
  name,
  direction = "row",
  helperText,
}) {
  const [checkedValue, setCheckedValue] = useState(value);

  function handleChange(e) {
    const newValue = e.target.value;
    setCheckedValue(newValue);
    onChange(e, newValue);
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        {label && (
          <p className={`${error ? "text-red-600" : "text-black"}`}>{label}</p>
        )}
        <div
          className="flex items-end gap-2"
          style={{ flexDirection: direction }}
        >
          {radios.map((radio, i) => (
            <Radio
              key={i}
              name={name}
              onChange={handleChange}
              value={radio.value}
              label={radio.label}
              checked={radio.value == checkedValue}
            />
          ))}
        </div>
      </div>
      {helperText && (
        <p className={`mt-1 ${error ? "text-red-600" : "text-black"}`}>
          {helperText}
        </p>
      )}
    </>
  );
}

RadioGroup.propTypes = {
  label: PropTypes.string,
  onChange: PropTypes.func,
  value: PropTypes.string,
  error: PropTypes.string,
  radios: PropTypes.array,
  name: PropTypes.string,
  direction: PropTypes.oneOf(["row", "column"]),
};
