import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  Navigate,
} from "react-router-dom";
import LoginAdmin from "./login/login-admin";
import LoginUser from "./login/login-user";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { CssVarsProvider } from "@mui/joy/styles";
import { useEffect, useState } from "react";
import AdminProjects from "./admin/Projects";
import AdminHome from "./admin/Home";
import AdminCandidates from "./admin/Candidates";
import axios from "axios";
import { RemoveTrailingSlash } from "./utils/remove-trailing-slash";
import Project from "./admin/Project";
import { Toaster } from "react-hot-toast";
import UserNew from "./user/UserNew";
import UserHome from "./user/UserHome";
import { PrivateAdminRoutes, PrivateUserRoutes } from "./utils/private-route";
import { CircularProgress, CssBaseline, Box } from "@mui/joy";
import { UserContextProvider } from "./providers/userContextProvider";
import { ProjectContextProvider } from "./providers/projectContextProvider";
import axiosRetry from "axios-retry";
import CandidateProfile from "./user/Profile";

const SERVER_URL =
  import.meta.env.NODE_ENV === "production"
    ? import.meta.env.VITE_SERVER_URL
    : "http://localhost:3000";

function App() {
  const location = useLocation();
  const hideSidebarRoutes = ["/", "/admin", "/user/new", "/404"];
  const shouldHideSidebar = hideSidebarRoutes.includes(location.pathname);

  useEffect(() => {
    document.title = "Overview";
  }, []);

  axios.defaults.baseURL = SERVER_URL;
  axios.defaults.withCredentials = true;
  axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startTime = Date.now();

    axios
      .get("/api")
      .then()
      .catch()
      .finally(() => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);

        setTimeout(() => {
          setLoading(false);
        }, remainingTime);
      });
  }, []);

  if (loading) {
    return (
      <Box
        sx={{ display: "flex", width: "100dvw", height: "100dvh" }}
        justifyContent="center"
        alignItems="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <CssVarsProvider disableTransitionOnChange>
      <UserContextProvider>
        <CssBaseline />
        <Box sx={{ display: "flex", minHeight: "100dvh" }}>
          {!shouldHideSidebar && <Sidebar />}
          {!shouldHideSidebar && <Header />}

          <Box
            component="main"
            className="MainContent"
            sx={{
              pt: { xs: "calc(12px + var(--Header-height))", md: 3 },
              pb: { xs: 2, sm: 2, md: 3 },
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              height: "100dvh",
              gap: 1,
              overflow: "auto",
            }}
          >
            <RemoveTrailingSlash />
            <ProjectContextProvider>
              <Routes>
                <Route element={<PrivateUserRoutes />}>
                  <Route path="/" element={<LoginUser />} />
                  <Route path="/user/new" element={<UserNew />} />
                  <Route path="/user/home" element={<UserHome />} />
                  <Route path="/user/profile" element={<CandidateProfile />} />
                </Route>

                {/* Admin routes */}

                <Route element={<PrivateAdminRoutes />}>
                  <Route path="/admin" element={<LoginAdmin />} />
                  <Route path="/admin/home" element={<AdminHome />} />
                  <Route
                    path="/admin/project/:projectCuid?"
                    element={<Project />}
                  />
                  <Route path="/admin/projects" element={<AdminProjects />} />
                  <Route
                    path="/admin/candidates"
                    element={<AdminCandidates />}
                  />
                  <Route
                    path="/admin/candidate/:candidateCuid"
                    element={<CandidateProfile />}
                  />
                </Route>

                <Route path="*" element={<Navigate to="/404" />} />
                <Route
                  path="/404"
                  element={
                    <h1
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100vh",
                        margin: 0,
                        textAlign: "center",
                      }}
                    >
                      TODO: 404 Page
                    </h1>
                  }
                />
              </Routes>
            </ProjectContextProvider>
          </Box>
        </Box>
      </UserContextProvider>
    </CssVarsProvider>
  );
}

function AppWithRouter() {
  return (
    <Router>
      <Toaster />
      <App />
    </Router>
  );
}

export default AppWithRouter;
