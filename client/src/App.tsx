import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { AppLayout } from "./components/AppLayout";
import { PatientLayout } from "./components/PatientLayout";
import { SpecialistLayout } from "./components/SpecialistLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import {
  AdminCriteriaPage,
  AdminDictionariesPage,
  AdminHomePage,
  AdminRequestsPage,
  AdminReviewsPage,
  AdminSpecialistsPage,
  AdminUsersPage,
} from "./pages/AdminPages";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { HomePage } from "./pages/HomePage";
import {
  MatchingCriteriaPage,
  MatchingNewPage,
  MatchingResultsPage,
  MyRequestsPage,
  MyReviewsPage,
  PatientDashboardPage,
  PatientProfilePage,
  RecommendationDetailPage,
  RecommendationsHistoryPage,
  SettingsPage,
} from "./pages/PatientPages";
import { AboutPage, ContactsPage, HowItWorksPage } from "./pages/StaticPages";
import {
  SpecialistDashboardPage,
  SpecialistProfileEditPage,
  SpecialistProfileViewPage,
  SpecialistRequestsPage,
  SpecialistServicesPage,
} from "./pages/SpecialistPortalPages";
import { SpecialistDetailPage, SpecialistsListPage } from "./pages/SpecialistsPages";

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
            <Route path="settings" element={<SettingsPage />} />
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
              <ProtectedRoute roles={["SPECIALIST", "ADMIN"]}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

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
