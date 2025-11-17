const PlaceholderSVG = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" className="w-full h-full">
        <rect width="400" height="300" fill="#f0fdf4"/>
        <circle cx="200" cy="150" r="60" fill="#86efac" opacity="0.3"/>
        <g transform="translate(200, 150)">
            <path d="M-40,20 L-20,-10 L0,10 L20,-20 L40,20 Z" fill="#22c55e" opacity="0.6"/>
            <circle cx="-25" cy="-15" r="8" fill="#16a34a"/>
            <rect x="-45" y="-25" width="90" height="50" fill="none" stroke="#16a34a" strokeWidth="3" rx="4"/>
        </g>
    </svg>
);
export default PlaceholderSVG;