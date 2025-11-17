import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Dashboard/Sidebar';

const DashboardLayout = () => {
    return (
        <div className="flex min-h-screen">
            <Sidebar />

            <div className="flex-1">
                <div className="p-5 pt-15 lg:pt-2">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;