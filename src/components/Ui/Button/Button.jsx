import PropTypes from "prop-types";
import { createElement } from "react";
import Loader from "../Loader/Loader";
export default function Button({
  children,
  onClick,
  className,
  type,
  component = "button",
  loading,
  ...props
}) {
  const ButtonComponent = createElement(
    component,
    {
      ...props,
      onClick: onClick,
      className: `primary__btn ${className || ""}`,
      type: type,
      disabled: loading || props.disabled,
    },
    children,
    loading && <Loader className={"ms-2"}/>
  );
  return ButtonComponent;
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  name: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  loading: PropTypes.bool,
};
