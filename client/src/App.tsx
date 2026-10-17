import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import {
  AdminCriteriaPage,
  AdminDictionariesPage,
  AdminHomePage,
  AdminRequestsPage,
  AdminReviewsPage,
  AdminSpecialistsPage,
  AdminUsersPage,
} from "./pages/AdminPages";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { HomePage } from "./pages/HomePage";
import {
  MatchingCriteriaPage,
  MatchingNewPage,
  MatchingResultsPage,
  MyRequestsPage,
  PatientDashboardPage,
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

          <Route path="dashboard" element={<PatientDashboardPage />} />
          <Route path="matching/new" element={<MatchingNewPage />} />
          <Route path="matching/:id/criteria" element={<MatchingCriteriaPage />} />
          <Route path="matching/:id/results" element={<MatchingResultsPage />} />
          <Route path="recommendations" element={<RecommendationsHistoryPage />} />
          <Route path="my-requests" element={<MyRequestsPage />} />
          <Route path="settings" element={<SettingsPage />} />

          <Route path="specialist/dashboard" element={<SpecialistDashboardPage />} />
          <Route path="specialist/profile/edit" element={<SpecialistProfileEditPage />} />
          <Route path="specialist/requests" element={<SpecialistRequestsPage />} />

          <Route path="admin" element={<AdminHomePage />} />
          <Route path="admin/users" element={<AdminUsersPage />} />
          <Route path="admin/specialists" element={<AdminSpecialistsPage />} />
          <Route path="admin/reviews" element={<AdminReviewsPage />} />
          <Route path="admin/dictionaries" element={<AdminDictionariesPage />} />
          <Route path="admin/criteria" element={<AdminCriteriaPage />} />
          <Route path="admin/requests" element={<AdminRequestsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
