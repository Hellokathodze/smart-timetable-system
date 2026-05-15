import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";

const Layout = () => {
    return (
        <div className="flex">

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 bg-gray-100 min-h-screen">
                <Topbar />

                <div className="p-6">
                    <Outlet />
                </div>

            </div>

        </div>
    );
};

export default Layout;