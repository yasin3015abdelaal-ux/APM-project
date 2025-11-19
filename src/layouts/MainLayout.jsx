import { Outlet } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import Sidebar from "../components/Navbar/Sidebar";
import SearchPage from "../components/Navbar/SearchPage";

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [showProfileHover, setShowProfileHover] = useState(false);

    return (
        <div className="flex flex-col min-h-screen">
            
            <div className="relative">
                <Navbar 
                    onMenuClick={() => setSidebarOpen(true)}
                    onSearchClick={() => setSearchOpen(true)}
                    showProfileHover={showProfileHover}
                    setShowProfileHover={setShowProfileHover}
                />
            </div>

            <main className="flex-grow">
                <Outlet />
            </main>

            <Footer />

            {/* Mobile Sidebar */}
            <Sidebar 
                isOpen={sidebarOpen} 
                onClose={() => setSidebarOpen(false)} 
            />

            {/* Search Page */}
            <SearchPage 
                isOpen={searchOpen} 
                onClose={() => setSearchOpen(false)} 
            />
        </div>
    );
};

export default MainLayout;