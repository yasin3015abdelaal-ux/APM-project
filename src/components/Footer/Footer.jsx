import { useTranslation } from "react-i18next";
import { FaFacebook, FaWhatsapp } from "react-icons/fa";
import logo from "../../assets/images/logo.jpg";
import { links } from "../../constant";
import { Link } from "react-router-dom";
import { FaXTwitter } from "react-icons/fa6";

export default function Footer() {
  const { t, i18n } = useTranslation();

  const socials = [
    { link: "#", icon: <FaFacebook />, label: "facebook" },
    { link: "#", icon: <FaXTwitter />, label: "X" },
    { link: "#", icon: <FaWhatsapp />, label: "whatsapp" },
  ];

  const countries = t("footer.countries.country", { returnObjects: true }) || [];

  return (
    <div className="bg-main text-white p-6 md:p-8" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <div className="container mx-auto">
        
        {/* Logo and Socials Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 lg:hidden">
          <img 
            src={logo} 
            alt="logo-image" 
            className="w-24 h-24 object-cover rounded-lg"
          />
          <div className="flex gap-3">
            {socials.map((social, index) => (
              <a 
                key={index}
                href={social.link}
                className="flex items-center justify-center w-10 h-10 text-white hover:scale-110 transition text-xl"
                aria-label={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-6">
          
          {/* Socials Section */}
          <div className="hidden lg:flex flex-col items-center sm:items-start">
            <h3 className="text-lg md:text-xl font-bold mb-3">
              {i18n.language === "ar" ? "تابعنا" : "Follow Us"}
            </h3>
            <div className="flex gap-3">
              {socials.map((social, index) => (
                <a 
                  key={index}
                  href={social.link}
                  className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 text-white hover:scale-110 transition text-xl md:text-2xl"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links Section */}
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="text-lg md:text-xl font-bold mb-3">
              {i18n.language === "ar" ? "روابط سريعة" : "Quick Links"}
            </h3>
            <div className="flex flex-col gap-2">
              {links.map((link, index) => (
                <Link 
                  key={index}
                  to={link.path || "#"}
                  className="text-sm md:text-base hover:underline transition"
                >
                  {t(link.label)}
                </Link>
              ))}
            </div>
          </div>

          {/* Countries Section */}
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="text-lg md:text-xl font-bold mb-3">
              {t("footer.countries.title")}
            </h3>
            <div className="flex flex-col gap-2">
              {countries.map((country, index) => (
                <p 
                  key={index} 
                  className="text-sm md:text-base"
                >
                  {country}
                </p>
              ))}
            </div>
          </div>

          {/* Logo Section */}
          <div className="hidden lg:flex flex-col items-center sm:items-start">
            <img 
              src={logo} 
              alt="logo-image" 
              className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-lg"
            />
          </div>
        </div>

        {/* Copyright Section */}
        <div className="text-center pt-4 border-t border-white border-opacity-30">
          <p className="text-xs md:text-sm mb-1">
            {t("footer.copyRight")} &copy;
          </p>
          <p className="text-xs md:text-sm">
            {t("footer.development")}
          </p>
        </div>
      </div>
    </div>
  );
}