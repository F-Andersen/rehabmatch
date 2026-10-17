import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
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
  PatientDashboardPage,
  RecommendationDetailPage,
  RecommendationsHistoryPage,
  SettingsPage,
} from "./pages/PatientPages";
import { AboutPage, ContactsPage, HowItWorksPage } from "./pages/StaticPages";
import {
  SpecialistDashboardPage,
  SpecialistProfileEditPage,
  SpecialistRequestsPage,
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
            path="dashboard"
            element={
              <ProtectedRoute roles={["PATIENT"]}>
                <PatientDashboardPage />
              </ProtectedRoute>
            }
          />
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
            path="recommendations"
            element={
              <ProtectedRoute roles={["PATIENT"]}>
                <RecommendationsHistoryPage />
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
            path="my-requests"
            element={
              <ProtectedRoute roles={["PATIENT"]}>
                <MyRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute roles={["PATIENT", "SPECIALIST", "ADMIN"]}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="specialist/dashboard"
            element={
              <ProtectedRoute roles={["SPECIALIST"]}>
                <SpecialistDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="specialist/profile/edit"
            element={
              <ProtectedRoute roles={["SPECIALIST"]}>
                <SpecialistProfileEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="specialist/requests"
            element={
              <ProtectedRoute roles={["SPECIALIST"]}>
                <SpecialistRequestsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="admin"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminHomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/specialists"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminSpecialistsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/reviews"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminReviewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/dictionaries"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminDictionariesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/criteria"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminCriteriaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/requests"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminRequestsPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
