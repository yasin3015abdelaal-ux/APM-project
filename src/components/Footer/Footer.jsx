import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <div className="bg-main text-white p-5">
      <div className="container">
        <div className="flex items-center justify-between"></div>
        {/* copy right */}
        <div className="text-center">
          <p>&copy;{t("footer.copyRight")}</p>
          <p className="mt-1">{t("footer.development")}</p>
        </div>
      </div>
    </div>
  );
}
