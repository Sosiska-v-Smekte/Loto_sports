import { useState } from "react";
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
import { NotificationsPage } from "./pages/NotificationsPage";
import { RegisterPage } from "./pages/RegisterPage";
import { UserPage } from "./pages/UserPage";
import { WelcomePage } from "./pages/WelcomePage";

function OwnProfileRedirect() {
  const { user } = useAuth();
  return user ? <Navigate to={`/users/${user.id}`} replace /> : null;
}

const WELCOME_SEEN = "welcome-seen";

const readSeen = () => {
  try {
    return sessionStorage.getItem(WELCOME_SEEN) === "1";
  } catch {
    return false;
  }
};

/** Главная: гостю сначала стартовая страница (войти или зарегистрироваться), вошедшему сразу лента событий. */
function HomeGate() {
  const { user, isLoading } = useAuth();
  const [seen, setSeen] = useState(readSeen);
  if (isLoading) return null;
  if (user || seen) return <HomePage />;
  return (
    <WelcomePage
      onBrowse={() => {
        try {
          sessionStorage.setItem(WELCOME_SEEN, "1");
        } catch {
          // Хранилище недоступно: лента откроется, но при перезагрузке снова будет стартовая страница
        }
        setSeen(true);
      }}
    />
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomeGate />} />
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
        <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth admin><AdminPage /></RequireAuth>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
