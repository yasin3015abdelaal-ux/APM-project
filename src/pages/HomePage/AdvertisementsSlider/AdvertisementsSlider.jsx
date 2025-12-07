import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Loader from '../../../components/Ui/Loader/Loader';
import PlaceholderSVG from '../../../assets/PlaceholderSVG';
import { getCachedAdvertisements } from '../../../api';

const AdvertisementsSlider = () => {
    const [advertisements, setAdvertisements] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    useEffect(() => {
        fetchAdvertisements();
    }, []);

    useEffect(() => {
        if (!isAutoPlaying || advertisements.length === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => 
                prevIndex === advertisements.length - 1 ? 0 : prevIndex + 1
            );
        }, 5000);

        return () => clearInterval(interval);
    }, [advertisements.length, isAutoPlaying]);

    const fetchAdvertisements = async () => {
        try {
            setIsLoading(true);
            const { data, fromCache } = await getCachedAdvertisements();
            console.log(fromCache ? '📦 Advertisements من الكاش' : '🌐 Advertisements من API');
            setAdvertisements(data);
        } catch (error) {
            console.error('Error fetching advertisements:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const goToSlide = (index) => {
        setCurrentIndex(index);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const goToPrevious = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? advertisements.length - 1 : currentIndex - 1;
        goToSlide(newIndex);
    };

    const goToNext = () => {
        const isLastSlide = currentIndex === advertisements.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        goToSlide(newIndex);
    };

    if (isLoading) {
        return <Loader />;
    }

    if (advertisements.length === 0) {
        return null;
    }

    return (
        <div className="relative w-[96%] mx-auto h-34 mt-4 md:h-[250px] rounded-2xl overflow-hidden shadow-xl group">
            <div className="relative w-full h-full">
                {advertisements.map((ad, index) => (
                    <div
                        key={ad.id}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                            index === currentIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        {ad.image_url ? (
                            <img
                                src={ad.image_url}
                                alt={`Advertisement ${ad.id}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'block';
                                }}
                            />
                        ) : null}
                        <div 
                            className={`${ad.image_url ? 'hidden' : 'block'} w-full h-full`}
                            style={{ display: ad.image_url ? 'none' : 'block' }}
                        >
                            <PlaceholderSVG />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    </div>
                ))}
            </div>

            {advertisements.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer bg-white/80 hover:bg-white text-gray-800 p-2 md:p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer bg-white/80 hover:bg-white text-gray-800 p-2 md:p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10"
                        aria-label="Next slide"
                    >
                        <ChevronRight size={24} />
                    </button>
                </>
            )}

            {advertisements.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {advertisements.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`transition-all cursor-pointer duration-300 rounded-full ${
                                index === currentIndex
                                    ? 'w-8 h-2 bg-white'
                                    : 'w-2 h-2 bg-white/50 hover:bg-white/75'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdvertisementsSlider;
