import React, { useRef, useEffect, useState } from "react";
import { HiOutlineLocationMarker } from 'react-icons/hi';
import { FaRegHeart } from 'react-icons/fa';
import { useTranslation } from "react-i18next";
import sadiaChickenImg from "../../assets/images/sadia-chicken.png";

const ads = [
  {
    id: 1,
    title: "ساديا صدور دجاج 450غ",
    location: "حدائق المعادي",
    time: "منذ 7 ساعات",
    price: "100 جنيه",
    image: sadiaChickenImg,
  },
  {
    id: 2,
    title: "ساديا صدور دجاج 450غ",
    location: "حدائق المعادي",
    time: "منذ 7 ساعات",
    price: "100 جنيه",
    image: sadiaChickenImg,
  },
  {
    id: 3,
    title: "ساديا صدور دجاج 450غ",
    location: "حدائق المعادي",
    time: "منذ 7 ساعات",
    price: "100 جنيه",
    image: sadiaChickenImg,
  },
  {
    id: 4,
    title: "ساديا صدور دجاج 450غ",
    location: "حدائق المعادي",
    time: "منذ 7 ساعات",
    price: "100 جنيه",
    image: sadiaChickenImg,
  },
  {
    id: 5,
    title: "ساديا صدور دجاج 450غ",
    location: "حدائق المعادي",
    time: "منذ 7 ساعات",
    price: "100 جنيه",
    image: sadiaChickenImg,
  },
  {
    id: 6,
    title: "ساديا صدور دجاج 450غ",
    location: "حدائق المعادي",
    time: "منذ 7 ساعات",
    price: "100 جنيه",
    image: sadiaChickenImg,
  },
  {
    id: 7,
    title: "ساديا صدور دجاج 450غ",
    location: "حدائق المعادي",
    time: "منذ 7 ساعات",
    price: "100 جنيه",
    image: sadiaChickenImg,
  },
  {
    id: 8,
    title: "ساديا صدور دجاج 450غ",
    location: "حدائق المعادي",
    time: "منذ 7 ساعات",
    price: "100 جنيه",
    image: sadiaChickenImg,
  },
  {
    id: 9,
    title: "ساديا صدور دجاج 450غ",
    location: "حدائق المعادي",
    time: "منذ 7 ساعات",
    price: "100 جنيه",
    image: sadiaChickenImg,
  },
  {
    id: 10,
    title: "ساديا صدور دجاج 450غ",
    location: "حدائق المعادي",
    time: "منذ 7 ساعات",
    price: "100 جنيه",
    image: sadiaChickenImg,
  },
  {
    id: 11,
    title: "ساديا صدور دجاج 450غ",
    location: "حدائق المعادي",
    time: "منذ 7 ساعات",
    price: "100 جنيه",
    image: sadiaChickenImg,
  },
  {
    id: 12,
    title: "ساديا صدور دجاج 450غ",
    location: "حدائق المعادي",
    time: "منذ 7 ساعات",
    price: "100 جنيه",
    image: sadiaChickenImg,
  },
];

function AdsCarousel() {
  const { t, i18n } = useTranslation();
  const dir = i18n.language === "ar" ? "rtl" : "ltr";
  const scrollRef = useRef(null);
  const [favs, setFavs] = useState([]);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current && !isDragging.current) {
        const container = scrollRef.current;
        const cardWidth = 250;
        const gap = 16;
        const cardsToScroll = 4;
        const scrollAmount = (cardWidth + gap) * cardsToScroll;

        if (dir === "rtl") {
          const currentScroll = Math.abs(container.scrollLeft);
          const maxScroll = container.scrollWidth - container.clientWidth;

          if (currentScroll >= maxScroll - 10) {
            container.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
          }
        } else {
          const atEnd =
            container.scrollLeft + container.clientWidth >=
            container.scrollWidth - 10;

          if (atEnd) {
            container.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            container.scrollBy({ left: scrollAmount, behavior: "smooth" });
          }
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [dir]);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const toggleFav = (id) => {
    setFavs((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  return (
    <div dir={dir} className="w-full py-6 select-none">
      <h2 className="text-2xl font-bold text-main px-4 mb-4">
        {t("home.adsSection.adsTitle")}
      </h2>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth px-4 snap-x snap-mandatory scrollbar-hide cursor-grab active:cursor-grabbing"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {ads.map((ad) => (
          <div
            draggable={false}
            key={ad.id}
            className="relative  w-1/4 min-w-[250px] snap-start border border-gray-200 rounded-2xl shadow-sm bg-white shrink-0 hover:shadow-md transition-transform hover:scale-[1.02] select-none"
          >
            <button
              onClick={() => toggleFav(ad.id)}
              className="absolute top-2 left-2 transition"
            >
              <FaRegHeart
                size={30}
                className="fill-main"
              />
            </button>

            <div className="flex justify-center border-b border-main">
              <img
                src={ad.image}
                alt={ad.title}
                className="w-[70%] h-30 object-contain rounded-t-2xl"
              />
            </div>

            <div className="p-3 text-right">
              <h3 className="font-bold text-md mb-1">{ad.title}</h3>

              <div className="flex items-center text-sm mb-1">
                <HiOutlineLocationMarker size={20} className="ml-1 text-main" />
                {ad.location}
              </div>

              <p className="text-xs">{ad.time}</p>

              <div className="flex items-center justify-between mt-3">
                <span className="font-bold text-sm">{ad.price}</span>
                <button className="bg-main text-white text-xs px-3 py-1.5 rounded-full hover:opacity-90 transition">
                  {t("home.adsSection.contactSeller")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdsCarousel;
