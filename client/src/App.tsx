import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { AppLayout } from "./components/AppLayout";
import { PatientLayout } from "./components/PatientLayout";
import { SpecialistLayout } from "./components/SpecialistLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./features/auth/AuthProvider";

import { HomePage } from "./pages/HomePage";

const AdminCriteriaPage = lazy(() => import("./pages/AdminPages").then((module) => ({ default: module.AdminCriteriaPage })));
const AdminDictionariesPage = lazy(() => import("./pages/AdminPages").then((module) => ({ default: module.AdminDictionariesPage })));
const AdminHomePage = lazy(() => import("./pages/AdminPages").then((module) => ({ default: module.AdminHomePage })));
const AdminRequestsPage = lazy(() => import("./pages/AdminPages").then((module) => ({ default: module.AdminRequestsPage })));
const AdminReviewsPage = lazy(() => import("./pages/AdminPages").then((module) => ({ default: module.AdminReviewsPage })));
const AdminSpecialistsPage = lazy(() => import("./pages/AdminPages").then((module) => ({ default: module.AdminSpecialistsPage })));
const AdminUsersPage = lazy(() => import("./pages/AdminPages").then((module) => ({ default: module.AdminUsersPage })));
const LoginPage = lazy(() => import("./pages/auth/LoginPage").then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage").then((module) => ({ default: module.RegisterPage })));
const MatchingCriteriaPage = lazy(() => import("./pages/PatientPages").then((module) => ({ default: module.MatchingCriteriaPage })));
const MatchingNewPage = lazy(() => import("./pages/PatientPages").then((module) => ({ default: module.MatchingNewPage })));
const MatchingResultsPage = lazy(() => import("./pages/PatientPages").then((module) => ({ default: module.MatchingResultsPage })));
const MyRequestsPage = lazy(() => import("./pages/PatientPages").then((module) => ({ default: module.MyRequestsPage })));
const MyReviewsPage = lazy(() => import("./pages/PatientPages").then((module) => ({ default: module.MyReviewsPage })));
const PatientDashboardPage = lazy(() => import("./pages/PatientPages").then((module) => ({ default: module.PatientDashboardPage })));
const PatientProfilePage = lazy(() => import("./pages/PatientPages").then((module) => ({ default: module.PatientProfilePage })));
const RecommendationDetailPage = lazy(() => import("./pages/PatientPages").then((module) => ({ default: module.RecommendationDetailPage })));
const RecommendationsHistoryPage = lazy(() => import("./pages/PatientPages").then((module) => ({ default: module.RecommendationsHistoryPage })));
const SettingsPage = lazy(() => import("./pages/PatientPages").then((module) => ({ default: module.SettingsPage })));
const AboutPage = lazy(() => import("./pages/StaticPages").then((module) => ({ default: module.AboutPage })));
const ContactsPage = lazy(() => import("./pages/StaticPages").then((module) => ({ default: module.ContactsPage })));
const HowItWorksPage = lazy(() => import("./pages/StaticPages").then((module) => ({ default: module.HowItWorksPage })));
const SpecialistDashboardPage = lazy(() => import("./pages/SpecialistPortalPages").then((module) => ({ default: module.SpecialistDashboardPage })));
const SpecialistProfileEditPage = lazy(() => import("./pages/SpecialistPortalPages").then((module) => ({ default: module.SpecialistProfileEditPage })));
const SpecialistProfileViewPage = lazy(() => import("./pages/SpecialistPortalPages").then((module) => ({ default: module.SpecialistProfileViewPage })));
const SpecialistRequestsPage = lazy(() => import("./pages/SpecialistPortalPages").then((module) => ({ default: module.SpecialistRequestsPage })));
const SpecialistServicesPage = lazy(() => import("./pages/SpecialistPortalPages").then((module) => ({ default: module.SpecialistServicesPage })));
const SpecialistDetailPage = lazy(() => import("./pages/SpecialistsPages").then((module) => ({ default: module.SpecialistDetailPage })));
const SpecialistsListPage = lazy(() => import("./pages/SpecialistsPages").then((module) => ({ default: module.SpecialistsListPage })));

function SettingsLayout() {
  const { user } = useAuth();
  if (user?.role === "PATIENT") return <PatientLayout />;
  if (user?.role === "SPECIALIST") return <SpecialistLayout />;
  return <AdminLayout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="specialists" element={<SpecialistsListPage />} />
          <Route path="specialists/:id" element={<SpecialistDetailPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="contacts" element={<ContactsPage />} />

          <Route
            element={
              <ProtectedRoute roles={["PATIENT"]}>
                <PatientLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<PatientDashboardPage />} />
            <Route path="profile" element={<PatientProfilePage />} />
            <Route path="recommendations" element={<RecommendationsHistoryPage />} />
            <Route path="my-requests" element={<MyRequestsPage />} />
            <Route path="my-reviews" element={<MyReviewsPage />} />
          </Route>
          <Route
            path="matching/new"
            element={
              <ProtectedRoute roles={["PATIENT"]}>
                <MatchingNewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="matching/:id/criteria"
            element={
              <ProtectedRoute roles={["PATIENT"]}>
                <MatchingCriteriaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="matching/:id/results"
            element={
              <ProtectedRoute roles={["PATIENT"]}>
                <MatchingResultsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="recommendations/:id"
            element={
              <ProtectedRoute roles={["PATIENT"]}>
                <RecommendationDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute roles={["PATIENT", "SPECIALIST", "ADMIN"]}>
                <SettingsLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SettingsPage />} />
          </Route>

          <Route
            element={
              <ProtectedRoute roles={["SPECIALIST"]}>
                <SpecialistLayout />
              </ProtectedRoute>
            }
          >
            <Route path="specialist/dashboard" element={<SpecialistDashboardPage />} />
            <Route path="specialist/profile" element={<SpecialistProfileViewPage />} />
            <Route path="specialist/profile/edit" element={<SpecialistProfileEditPage />} />
            <Route path="specialist/services" element={<SpecialistServicesPage />} />
            <Route path="specialist/requests" element={<SpecialistRequestsPage />} />
          </Route>

          <Route
            path="admin"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminHomePage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="specialists" element={<AdminSpecialistsPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="dictionaries" element={<AdminDictionariesPage />} />
            <Route path="criteria" element={<AdminCriteriaPage />} />
            <Route path="requests" element={<AdminRequestsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
