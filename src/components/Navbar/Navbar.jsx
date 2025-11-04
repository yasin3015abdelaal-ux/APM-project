import React from "react";
import { useTranslation } from "react-i18next";
import logo from "../../assets/images/logo.jpg";
import flag from "../../assets/images/egypt flag.png";
const Navbar = () => {
  const { t, i18n } = useTranslation();
  return (
    <div className="w-full px-[90px] md:px-[50px] sm:px-2.5 flex justify-center items-center py-5">
      <div className="flex items-center justify-between gap-3">
        <div className="w-20 h-20 max-[1150px]:w-15 max-[1150px]:h-15 max-[900px]:h-12 max-[900px]:w-12  bg-gray-300 border border-[--color-main] rounded-full relative">
          <img
            src={flag}
            className="absolute w-8 border rounded-full h-8 top-[60%] left-[60%]"
          />
        </div>
        <div className="text-[--color-main] text-xl  sm:text-xs font-semibold">
          Eg
        </div>
        <button className="text-2xl max-[990px]:text-xl md:text-xl sm:text-xs border p-2 rounded-md cursor-pointer text-[--color-main]">
          {t("auction")}
        </button>
        <button className="text-2xl max-[1000px]:text-20 max-[880px]:text-18 sm:text-xs  border p-2 rounded-md cursor-pointer">
          {t("shareAdv")}
        </button>
        <div className="w-[612px] max-[1100px]:w-[500px] max-[990px]:w-[400px] max-[860px]:w-[350px] relative flex items-center">
          <i className="fa-solid fa-magnifying-glass text-gray-600 text-3xl absolute left-1 "></i>
          <input
            type="text"
            className={`h-[50px] w-[612px] text-2xl border rounded px-4 ${
              i18n.language === "ar" ? "text-right" : "text-left"
            }`}
            dir={i18n.language === "ar" ? "rtl" : "ltr"}
            placeholder={t("search")}
          />
        </div>
        <div>
          <img src={logo} alt="" className="w-20 h-full " />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
