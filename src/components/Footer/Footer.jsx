import { useTranslation } from "react-i18next";
import { FaFacebook, FaWhatsapp } from "react-icons/fa";
import logo from "../../assets/images/logo.jpg";
import { Link } from "react-router-dom";
import { FaXTwitter } from "react-icons/fa6";

export default function Footer() {
  const { t, i18n } = useTranslation();

  const socials = [
    { link: "#", icon: <FaFacebook />, label: "facebook" },
    { link: "#", icon: <FaXTwitter />, label: "X" },
    { link: "#", icon: <FaWhatsapp />, label: "whatsapp" },
  ];

  const footerLinks = [
    { label: "footer.links.aboutUs", path: "/about-us" },
    { label: "footer.links.ads", path: "/ads" },
    { label: "footer.links.auction", path: "/auction" },
    { label: "footer.links.contactUs", path: "/contact" },
  ];

  const countries = t("footer.countries.country", { returnObjects: true }) || [];

  return (
    <footer className="bg-gradient-to-br from-main via-main to-main/90 text-white" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <div className="container mx-auto px-4 py-8 md:px-6">

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-6">

          {/* Logo & Social Section */}
          <div className="flex flex-col items-center md:items-start space-y-4 lg:col-span-3">
            <img
              src={logo}
              alt="logo"
              className="w-20 h-20 object-cover rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
            />
            <div>
              <h3 className="text-base font-bold mb-3">
                {i18n.language === "ar" ? "تابعنا" : "Follow Us"}
              </h3>
              <div className="flex gap-3">
                {socials.map((social, index) => (
                  <a
                    key={index}
                    href={social.link}
                    className="flex items-center justify-center w-9 h-9 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white hover:text-main hover:-translate-y-1 transition-all duration-300 text-base shadow-md hover:shadow-xl"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="flex flex-col items-center md:items-start lg:col-span-2">
            <h3 className="text-base font-bold mb-3 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-23 after:h-0.75 after:bg-white/50 after:rounded">
              {i18n.language === "ar" ? "روابط سريعة" : "Quick Links"}
            </h3>
            <nav className="flex flex-col gap-2">
              {footerLinks.map((link, index) => (
                <Link
                  key={index}
                  to={link.path}
                  className="text-white/90 hover:text-white hover:translate-x-1 transition-all duration-300 text-sm group flex items-center gap-2"
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-white transition-all duration-300"></span>
                  {t(link.label)}
                </Link>
              ))}
            </nav>
          </div>

          {/* Countries Section */}
          <div className="flex flex-col items-center lg:col-span-7">
            <h3 className="text-base font-bold mb-3 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-16 after:h-0.75 after:bg-white/50 after:rounded text-center">
              {t("footer.countries.title")}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-1.5 w-full">
              {countries.map((country, index) => (
                <p
                  key={index}
                  className="text-white/80 text-xs hover:text-white transition-colors duration-300 flex items-center gap-1.5"
                >
                  <span className="w-1 h-1 bg-white/60 rounded-full flex-shrink-0"></span>
                  <span className="truncate">{country}</span>
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 border-t border-white/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-xs text-white/70 text-center md:text-start">
              {t("footer.copyRight")}
            </p>
            <p className="text-xs text-white/70 text-center md:text-end flex items-center gap-1.5">
              {i18n.language === "ar" ? "تم التطوير بواسطة" : "Developed by"}
              <a
                href="https://www.linkedin.com/company/soft-forte/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white text-white hover:text-main rounded-full text-sm font-bold backdrop-blur-sm border border-white/20 hover:border-white transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <span>Soft Forte</span>
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}