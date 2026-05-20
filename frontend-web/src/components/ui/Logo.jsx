import logo from "../../assets/logo-pharmalocate.png";
import { Link } from "react-router-dom";

const positionClasses = {
  static: "",
  sticky: "sticky top-0 z-40",
  fixed: "fixed left-0 top-0 z-50",
};

function Logo({
  className = "h-12",
  position = "static",
  classNameWrapper = "",
  imageClassName = "",
  to,
}) {
  const content = (
    <div
      className={`inline-flex items-center justify-center ${positionClasses[position] || ""} ${classNameWrapper}`}
    >
      <img
        src={logo}
        alt="PharmaLocate"
        className={`${className} object-contain ${imageClassName}`}
      />
    </div>
  );

  if (to) {
    return (
      <Link to={to} aria-label="Retour au dashboard" className="inline-flex shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}

export default Logo;
