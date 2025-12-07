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
      <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
        
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-6">
          
          {/* Logo & About Section */}
          <div className="flex flex-col items-center md:items-start space-y-3">
            <img 
              src={logo} 
              alt="logo" 
              className="w-24 h-24 object-cover rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
            />
          </div>

          {/* Quick Links Section */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-bold mb-4 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-24 after:h-1 after:bg-white/50 after:rounded">
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
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-bold mb-4 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-white/50 after:rounded">
              {t("footer.countries.title")}
            </h3>
            <div className="flex flex-col gap-2">
              {countries.map((country, index) => (
                <p 
                  key={index} 
                  className="text-white/80 text-sm hover:text-white transition-colors duration-300 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-white/60 rounded-full"></span>
                  {country}
                </p>
              ))}
            </div>
          </div>

          {/* Social Media Section */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-bold mb-4 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-white/50 after:rounded">
              {i18n.language === "ar" ? "تابعنا" : "Follow Us"}
            </h3>
            <div className="flex gap-3">
              {socials.map((social, index) => (
                <a 
                  key={index}
                  href={social.link}
                  className="flex items-center justify-center w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white hover:text-main hover:-translate-y-1 transition-all duration-300 text-lg shadow-md hover:shadow-xl"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-sm text-white/70 text-center md:text-start">
              {t("footer.copyRight")} &copy; {new Date().getFullYear()} {i18n.language === "ar" ? "جميع الحقوق محفوظة" : "All Rights Reserved"}
            </p>
            <p className="text-sm text-white/70 text-center md:text-end">
              {t("footer.development")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}