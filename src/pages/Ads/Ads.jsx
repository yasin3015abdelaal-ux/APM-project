import { useState } from "react";
import { useTranslation } from "react-i18next";
import fakeImage from "../../assets/images/sadia-chicken.png";
import { IoLocationOutline } from "react-icons/io5";
import { FaEye, FaRegEdit, FaRegHeart } from "react-icons/fa";
import IconButton from "../../components/Ui/IconButtons/IconButton";
import Button from "../../components/Ui/Button/Button";
import Loader from "../../components/Ui/Loader/Loader";
function FilterAds({ setFilter }) {
  const { t } = useTranslation();
  const statusOptions = [
    { value: "status", label: "حالة الاعلان", selected: true },
  ];
  const allOptions = [{ value: "all", label: "الكل", selected: true }];

  function handleFilterChange(e) {
    setFilter((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return (
    <div className="flex items-center gap-3 ">
      {/* status */}
      <select
        className="text-white bg-main focus:outline-none rounded-md px-1 marker:text-red-200"
        name="status"
        onChange={handleFilterChange}
      >
        {statusOptions.map((option) => (
          <option {...option} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {/* all */}
      <select
        className="text-white bg-main focus:outline-none rounded-md px-1 marker:text-red-200"
        name="all"
        onChange={handleFilterChange}
      >
        {allOptions.map((option) => (
          <option {...option} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function AdsItem({ item }) {
  const { id, image, title, place, watchers, interested, price } = item;
  const { t } = useTranslation();
  return (
    <div className="flex rounded-xl border-2 border-main gap-2 flex-col md:flex-row">
      {/* image */}
      <div className="border-b-2 border-l-0 border-main p-2 md:border-l-2 md:border-b-0">
        <img
          src={image}
          alt={`image-logo-for-${id}`}
          className="w-full object-cover"
        />
      </div>
      {/* text */}
      <div className="flex flex-col ms-3 md:ms-0 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-4xl my-1 gap-1">{title}</h3>
          {/* edit */}
          <IconButton size="medium">
            <FaRegEdit />
          </IconButton>
        </div>
        <div className="flex items-center">
          <IoLocationOutline className="text-main" size={25} />
          <p className="font-semibold">{place}</p>
        </div>
        <div className="flex items-center my-2 gap-1">
          <FaEye className="text-main" size={25} />
          <p className="font-semibold">
            {t("ads.watcher")} {watchers}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <FaRegHeart className="text-main" size={25} />
          <p className="font-semibold">
            {t("ads.interested")} {interested}
          </p>
        </div>
        <div className="flex items-center justify-between mt-auto mb-2 me-2 flex-col md:flex-row gap-2">
          <h6 className="font-bold text-4xl ">
            {price} {t("ads.concurrency")}
          </h6>
          <Button>{t("ads.sell")}</Button>
        </div>
      </div>
    </div>
  );
}

export default function Ads() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState({ status: "", all: "" });

  const adsItems = [
    {
      id: 1,
      image: fakeImage,
      title: "ساديا صدور دجاج 450غ",
      place: "حدائق المعادي",
      watchers: 12,
      interested: 2,
      price: 100,
    },
  ];

  return (
    <section>
      <div className="container">
        <h3 className="section__title">{t("ads.title")}</h3>
        <div className="flex items-center justify-between">
          {/* filter section */}
          <FilterAds setFilter={setFilter} />
          {/* add new ads */}
          <Button>{t("ads.makeAds")}</Button>
        </div>
        {/* ads list */}
        <div className="grid grid-cols-1 gap-2 my-3 ">
          {adsItems.length == 0 ? (
            <p className="text-center text-4xl font-bold min-h-screen">
              {t("ads.noContent")}
            </p>
          ) : (
            adsItems.map((item) => <AdsItem item={item} />)
          )}
        </div>
      </div>
    </section>
  );
}
