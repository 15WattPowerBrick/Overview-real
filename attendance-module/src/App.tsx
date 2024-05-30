import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import LoginAdmin from "./login/login-admin";
import LoginUser from "./login/login-user";
import Box from "@mui/joy/Box";
import Sidebar from "./components/Sidebar";
import SidebarUser from "./components/SidebarUser";
import Header from "./components/Header";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
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
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { User } from "./types";
import { PrivateAdminRoutes, PrivateUserRoutes } from "./utils/private-route";
import { CircularProgress } from "@mui/joy";

function App() {
  const location = useLocation();
  const hideSidebarRoutes = ["/", "/admin", "/user/new"];
  const shouldHideSidebar = hideSidebarRoutes.includes(location.pathname);
  const isUserRoute = location.pathname.startsWith("/user");

  useEffect(() => {
    document.title = "Overview";
  }, []);

  axios.defaults.baseURL = "http://localhost:3000";
  axios.defaults.withCredentials = true;

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const startTime = Date.now();

    axios
      .get("/api")
      .then((response) => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);

        setTimeout(() => {
          setUser(response.data);
        }, remainingTime);
      })
      .catch((error) => {
        console.error("There was an error fetching the data!", error);
      });
  }, []);

  if (!user) {
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
    <DndProvider backend={HTML5Backend}>
      <CssVarsProvider disableTransitionOnChange>
        <CssBaseline />
        <Box sx={{ display: "flex", minHeight: "100dvh" }}>
          {!isUserRoute && !shouldHideSidebar && <Sidebar />}
          {!shouldHideSidebar && <Header />}
          {isUserRoute && !shouldHideSidebar && <SidebarUser />}

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
            <Routes>
              {/* User routes */}
              {/* <Route element={<PrivateUserRoutes user={user}/>}>
              <Route path="/user" element={<LoginUser />} />
              <Route path="/user/home" element={<MyProfile />} />
            </Route> */}

              <Route path="/" element={<LoginUser />} />
              <Route path="/user/new" element={<UserNew />} />
              <Route path="/user/home" element={<UserHome />} />

              {/* Admin routes */}

              <Route element={<PrivateAdminRoutes user={user} />}>
                <Route path="/admin" element={<LoginAdmin />} />
                <Route path="/admin/home" element={<AdminHome />} />
                <Route
                  path="/admin/project/:projectId?"
                  element={<Project />}
                />
                <Route path="/admin/projects" element={<AdminProjects />} />
                <Route path="/admin/candidates" element={<AdminCandidates />} />
              </Route>
            </Routes>
          </Box>
        </Box>
      </CssVarsProvider>
    </DndProvider>
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
