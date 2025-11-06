import { useTranslation } from "react-i18next";
import { FaFacebook, FaTwitter, FaWhatsapp } from "react-icons/fa";
import logo from "../../assets/images/logo.jpg";
import { links } from "../../constant";
import { Link } from "react-router-dom";
export default function Footer() {
  const { t } = useTranslation();

  const socials = [
    { link: "#", icon: <FaTwitter size={70} />, label: "twitter" },
    { link: "#", icon: <FaFacebook size={70} />, label: "facebook" },
    { link: "#", icon: <FaWhatsapp size={70} />, label: "whatsapp" },
  ];

  const countries =
    t("footer.countries.country", { returnObjects: true }) || [];

  return (
    <div className="bg-main text-white p-5">
      <div className="container">
        <div className="flex items-center justify-between mb-5 flex-col lg:flex-row gap-5">
          {/* first div socials */}
          <div className="flex gap-3">
            {socials.map((social,index) => (
              <div className="flex items-center justify-center" key={index}>
                {social.icon}
              </div>
            ))}
          </div>
          {/* secondes div links */}
          <div className="flex flex-col gap-2">
            {links.map((link,index) => (
              <p className="text-4xl font-bold" key={index}>
                <Link>{t(link.label)}</Link>
              </p>
            ))}
          </div>
          {/* third div countries */}
          <div className="flex flex-col gap-2">
            <p className="text-4xl font-bold">{t("footer.countries.title")}</p>
            {countries.map((country) => (
              <p className="text-4xl font-bold" key={country}>{country}</p>
            ))}
          </div>

          {/* third div logos */}
          <div>
            <img src={logo} alt="logo-image" className="max-w-50" />
          </div>
        </div>
        {/* copy right */}
        <div className="text-center">
          <p>{t("footer.copyRight")} &copy;</p>
          <p className="mt-1">{t("footer.development")}</p>
        </div>
      </div>
    </div>
  );
}
