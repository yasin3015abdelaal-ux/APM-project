import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App";
import MainLayout from "../layouts/MainLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import HomePage from "../pages/HomePage/HomePage";
import Ads from "../pages/Ads/Ads";
import Register from "../components/Register/Register";
import Login from "../components/Login/Login";
import ProductsPage from "../components/Products/ProductsPage";
import ProductDetails from "../components/Products/ProductDetails";
import DashboardHome from "../pages/Dashboard/Home";
import { ProtectedRoute, PublicRoute } from "../RouteGuards/RouteGuards";
import { ProtectedAdminRoute } from "../contexts/AdminContext";
import Additions from "../components/Dashboard/Additions/Additions";
import Category from "../components/Dashboard/Additions/Category";
import Accounts from "../components/Dashboard/Accounts/Accounts";
import UpdateAccount from "../components/Dashboard/Accounts/UpdateAccount";
import DashboardInvoices from "../components/Dashboard/Invoices/Invoices";
import SubscriptionsPage from "../pages/Dashboard/SubscriptionsPage";
import InvoicesPage from "../pages/Dashboard/InvoicesPage";
import InvoiceDetailsPage from "../pages/Dashboard/InvoiceDetailsPage";
import AuctionsList from "../pages/Dashboard/AuctionsList";
import AuctionDetails from "../pages/Dashboard/AuctionDetails";
import VerificationsList from "../pages/Dashboard/VerificationsList";
import VerificationDetails from "../pages/Dashboard/VerificationDetails";
import TodayPrices from "../pages/Dashboard/TodayPrices";
import AdvertisementsPage from "../pages/Dashboard/AdvertisementsPage";
import PackagesPage from "../pages/Dashboard/PackagesPage";
import ArticlesPage from "../pages/Dashboard/ArticlesPage";
import ChatPage from "../pages/Dashboard/ChatPage";
import VerifyAccountPage from "../pages/Profile/VerifyAccount";
import EditProfilePage from "../pages/Profile/EditProfilePage";
import ProfilePage from "../pages/Profile/ProfilePage";
import EditAds from "../pages/Ads/EditAd";
import AddAds from "../pages/Ads/AddAd";
import NotFound from "../pages/NotFound";
import Messages from "../pages/Messages/Messages";
import Notifications from "../pages/Notifications/Notifications";
import FavoritesPage from "../pages/Favorites/FavoritesPage";
import ProductsReview from "../components/Dashboard/Products";

export const routers = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Main Layout Routes 
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <HomePage /> },
          {
            path: "login",
            element: (
              <PublicRoute restricted={true}>
                <Login />
              </PublicRoute>
            ),
          },
          {
            path: "register",
            element: (
              <PublicRoute restricted={true}>
                <Register />
              </PublicRoute>
            ),
          },
          { path: "ads", element: <Ads /> },
          {
            path: "ads/create",
            element: (
              <ProtectedRoute>
                <AddAds />
              </ProtectedRoute>
            ),
          },
          {
            path: "ads/:id/edit",
            element: (
              <ProtectedRoute>
                <EditAds />
              </ProtectedRoute>
            ),
          },
          {
            path: "messages",
            element: (
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            ),
          },
          {
            path: "notifications",
            element: (
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            ),
          },
          {
            path: "favorites",
            element: (
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "profile",
            element: (
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            ),
          },
          {
            path: "profile/edit",
            element: (
              <ProtectedRoute>
                <EditProfilePage />
              </ProtectedRoute>
            ),
          },
          {
            path: "profile/verify",
            element: (
              <ProtectedRoute>
                <VerifyAccountPage />
              </ProtectedRoute>
            ),
          },
{
  path: "products",
  children: [
    {
      // Route for all products (no category selected)
      index: true,
      element: (
        <ProtectedRoute>
          <ProductsPage />
        </ProtectedRoute>
      ),
    },
    {
      // Route for specific category
      path: ":categoryId",
      element: (
        <ProtectedRoute>
          <ProductsPage />
        </ProtectedRoute>
      ),
    },
  ],
},
{
  // Route for product details
  path: "product-details/:id",
  element: (
    <ProtectedRoute>
      <ProductDetails />
    </ProtectedRoute>
  ),
},
        ],
      },

      // Admin Login Route 
      {
        path: "admin/login",
        element: <Login />,
      },

      // Dashboard Routes
      {
        path: "dashboard",
        element: (
          <ProtectedAdminRoute>
            <DashboardLayout />
          </ProtectedAdminRoute>
        ),
        children: [
          { index: true, element: <DashboardHome /> },
          { path: "additions", element: <Additions /> },
          { path: "additions/category/:categoryId", element: <Category /> },
          // { path: "products", element: <Products /> },
          { path: "accounts", element: <Accounts /> },
          { path: "accounts/update-account/:userId", element: <UpdateAccount /> },
          { path: "auctions", element: <AuctionsList /> },
          { path: "auctions/:id", element: <AuctionDetails /> },
          { path: "ads", element: <AdvertisementsPage /> },
          { path: "packages", element: <PackagesPage /> },
          { path: "articles", element: <ArticlesPage /> },
          { path: "messages", element: <ChatPage /> },
          { path: "verification", element: <VerificationsList /> },
          { path: "verification/:id", element: <VerificationDetails /> },
          { path: "today-price", element: <TodayPrices /> },
          { path: "invoices-old", element: <DashboardInvoices /> },
          { path: "subscriptions", element: <SubscriptionsPage /> },
          { path: "invoices", element: <InvoicesPage /> },
          { path: "invoice/:id", element: <InvoiceDetailsPage /> },
          { path: "products", element: <ProductsReview /> },
          { path: "*", element: <Navigate to="/dashboard" replace /> },
        ],
      },

      // 404 Route
      { path: "*", element: <NotFound /> },
    ],
  },
]);
