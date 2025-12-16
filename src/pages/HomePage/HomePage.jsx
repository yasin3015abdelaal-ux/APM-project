import AdsCarousel from "./AdsCarousel/AdsCarousel";
import Categories from "../../components/Categories/Categories";
import LivestockPrices from './Chart/LivestockPrices';
import AuctionHomeWidget from "./AuctionWidget/Widget";
import { useTranslation } from "react-i18next";
import { auctionAPI } from "../../api";
import AdvertisementsSlider from "./AdvertisementsSlider/AdvertisementsSlider";
import TopSellers from "./SellerReviews/TopSellers";
const HomePage = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === "ar";

  return (
    <div>
      <div className="container">
        <AdvertisementsSlider />
        <Categories mode="products"/>
        <LivestockPrices />
        <AuctionHomeWidget 
                isRTL={isRTL}
                auctionAPI={auctionAPI}
            />        
            <AdsCarousel />
            <TopSellers />
      </div>
    </div>
  );
};

export default HomePage;
