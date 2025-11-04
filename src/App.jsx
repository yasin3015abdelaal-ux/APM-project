import HomeProductsSection from "./components/HomeProductsSection"
import Navbar from "./components/navbar"


function App() {


  return (
    <>
      <Navbar/>
      <div className="px-[90px]">
        <HomeProductsSection/>
      </div>
    </>
  )
}

export default App
