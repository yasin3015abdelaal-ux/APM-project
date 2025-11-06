import PropTypes from "prop-types";
import { cloneElement } from "react";
import Loader from "../Loader/Loader";
export default function IconButton({
  children,
  className,
  onClick,
  size = "medium",
  loading,
  ...props
}) {
  const sizes = {
    large: {
      size: 30,
      width: 19,
      height: 19,
    },
    medium: {
      size: 23,
      width: 12,
      height: 12,
    },
    small: {
      size: 20,
      width: 10,
      height: 10,
    },
  };
  return (
    <button
      {...props}
      role="button"
      onClick={onClick}
      className={`icon__button ${className}`}
      style={{ width: sizes[size].width * 4, height: sizes[size].height * 4 }}
      disabled={props.disabled || loading}
    >
      {loading ? (
        <Loader />
      ) : (
        cloneElement(children, { size: sizes[size].size })
      )}
    </button>
  );
}
IconButton.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
  size: PropTypes.oneOfType(["large", "small", "medium"]),
};
