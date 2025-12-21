import { X } from "lucide-react";

const AnnouncementPopup = ({ announcement, onClose }) => {
    if (!announcement) return null;

    console.log("Announcement data:", announcement);

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
        >
            <div 
                className="bg-gradient-to-br from-white to-gray-50 rounded-3xl max-w-4xl w-full h-[65vh] overflow-hidden shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-500 relative"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 transition-all duration-300 hover:scale-110 hover:rotate-90 group"
                    aria-label="Close"
                >
                    <X className="w-6 h-6 cursor-pointer text-gray-700 transition-colors" />
                </button>

                {/* Image Section */}
                {announcement.image_url && (
                    <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-[1]"></div>
                        <img 
                            src={announcement.image_url} 
                            alt="Announcement" 
                            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                            onError={(e) => {
                                console.error("Image failed to load:", announcement.image_url);
                                e.target.style.display = 'none';
                            }}
                            onLoad={() => console.log("Image loaded successfully")}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnnouncementPopup;