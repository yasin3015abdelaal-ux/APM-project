import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import Sidebar from "../components/Navbar/Sidebar";
import SearchPage from "../components/Navbar/Searchpage";
import { CartProvider } from "../contexts/CartContext";
import { ChatProvider } from "../contexts/ChatContext";
import { dataAPI } from "../api";
import AnnouncementPopup from "../components/Announcement/AnnouncementPopup";
import { useAuth } from "../contexts/AuthContext";
import { NotificationProvider } from "../contexts/NotificationContext";

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [showProfileHover, setShowProfileHover] = useState(false);
    const [announcement, setAnnouncement] = useState(null); 
    const [showAnnouncement, setShowAnnouncement] = useState(false); 
    const location = useLocation();
    const { isAuthenticated, loading } = useAuth();

    useEffect(() => {
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname, location.search, location.key]);

    useEffect(() => {
        const fetchAnnouncement = async () => {
            if (!isAuthenticated || loading) {
                return;
            }

            try {
                const hasSeenAnnouncement = sessionStorage.getItem('hasSeenAnnouncement');
                
                if (!hasSeenAnnouncement) {
                    const response = await dataAPI.getAnnouncement();
                    
                    if (response.data && response.data.data && response.data.data.length > 0) {
                        setAnnouncement(response.data.data[0]);
                        setShowAnnouncement(true);
                    }
                }
            } catch (error) {
                console.error("Error fetching announcement:", error);
            }
        };

        fetchAnnouncement();
    }, [isAuthenticated, loading]);

    const handleCloseAnnouncement = () => {
        setShowAnnouncement(false);
        sessionStorage.setItem('hasSeenAnnouncement', 'true');
    };

    return (
        <CartProvider>
            <ChatProvider>
                <NotificationProvider>
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

                {showAnnouncement && isAuthenticated && (
                    <AnnouncementPopup
                        announcement={announcement}
                        onClose={handleCloseAnnouncement}
                    />
                )}
            </div>
            </NotificationProvider>
            </ChatProvider>
        </CartProvider>
    );
};

export default MainLayout;