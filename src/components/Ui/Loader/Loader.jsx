import { FiLoader } from "react-icons/fi";
import PropTypes from "prop-types";
export default function Loader({className,...props}) {
  return <div className={`animate-spin text-inherit ${className}`} {...props}>{<FiLoader />}</div>;
}

Loader.propTypes ={
  className:PropTypes.string
}