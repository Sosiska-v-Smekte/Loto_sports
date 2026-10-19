import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { RequireAuth } from "./components/RequireAuth";
import { useAuth } from "./features/auth";
import { AdminPage } from "./pages/AdminPage";
import { CommunitiesPage } from "./pages/CommunitiesPage";
import { CommunityPage } from "./pages/CommunityPage";
import { CreateEventPage } from "./pages/CreateEventPage";
import { EventPage } from "./pages/EventPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MyPage } from "./pages/MyPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RegisterPage } from "./pages/RegisterPage";
import { UserPage } from "./pages/UserPage";

function OwnProfileRedirect() {
  const { user } = useAuth();
  return user ? <Navigate to={`/users/${user.id}`} replace /> : null;
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/events/new" element={<RequireAuth><CreateEventPage /></RequireAuth>} />
        <Route path="/events/:id" element={<EventPage />} />
        <Route path="/my" element={<RequireAuth><MyPage /></RequireAuth>} />
        <Route path="/communities" element={<CommunitiesPage />} />
        <Route path="/communities/:id" element={<CommunityPage />} />
        {/* Старый адрес профиля: ведёт на свой публичный профиль, чтобы не было битых ссылок */}
        <Route path="/profile" element={<RequireAuth><OwnProfileRedirect /></RequireAuth>} />
        <Route path="/users/:id" element={<UserPage />} />
        <Route path="/admin" element={<RequireAuth admin><AdminPage /></RequireAuth>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
