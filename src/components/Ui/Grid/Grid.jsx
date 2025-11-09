import PropTypes from "prop-types";
import clsx from "clsx";

export default function Grid({
  children,
  size = 12,
  gap = 0,
  gapX = 0,
  gapY = 0,
  container,
  alignItems,
  justifyContent,
}) {
  const gapClasses = clsx(
    gap && `gap-${gap}`,
    gapX && `gap-x-${gapX}`,
    gapY && `gap-y-${gapY}`
  );

  const containerClasses = clsx("flex flex-wrap", gapClasses);

  function generateChildWidth() {
    if (typeof size === "number") {
      return `w-[${Math.floor((size / 12) * 100)}%]`;
    }
    if (typeof size === "object") {
      let generateClass = "";
      for (const key in size) {
        generateClass += `${key}:w-[${Math.floor((size[key] / 12) * 100)}%] `;
      }
      return generateClass.trim();
    }
  }

  const childClasses = clsx(generateChildWidth());
  return (
    <div className={container ? containerClasses : childClasses}>
      {children}
    </div>
  );
}

Grid.propTypes = {
  gap: PropTypes.number,
  gapY: PropTypes.number,
  gapX: PropTypes.number,
  children: PropTypes.node,
  size: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      xs: PropTypes.number,
      sm: PropTypes.number,
      md: PropTypes.number,
      lg: PropTypes.number,
      xl: PropTypes.number,
    }),
  ]),
  container: PropTypes.bool,
  alignItems: PropTypes.string,
  justifyContent: PropTypes.string,
};
