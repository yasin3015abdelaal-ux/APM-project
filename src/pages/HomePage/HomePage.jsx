import React from "react";
import AdsCarousel from "../../components/Landing/AdsCarousel";
import Categories from "../../components/Categories/Categories";

const HomePage = () => {
  return (
    <div>
      <div className="container">
        <Categories mode="products"/>
        <AdsCarousel />
      </div>
    </div>
  );
};

export default HomePage;
