import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layout";
import {createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import { Provider } from 'react-bus';
import FileInfoPage from "./pages/FileInfoPage";
import ForgotPasswordModal from "./components/modals/ForgotPasswordModal";
import ResetPasswordPage from "./pages/ResetPasswordPage";


const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
});

function App() {
  return (
      <Provider>
          <ThemeProvider theme={theme}>
              <CssBaseline />
              <BrowserRouter>
                  <AuthProvider>
                      <ForgotPasswordModal />
                      <Routes>
                          <Route path="/login" element={
                              <PublicRoute>
                                <LoginPage />
                              </PublicRoute>
                          } />
                          <Route path="/register" element={
                              <PublicRoute>
                                <RegisterPage />
                              </PublicRoute>
                          } />
                          <Route path="/reset-password" element={
                              <PublicRoute>
                                  <ResetPasswordPage />
                              </PublicRoute>
                          } />

                          <Route path="/" element={
                              <ProtectedRoute>
                                <Layout />
                              </ProtectedRoute>
                          }>
                              <Route index element={<Dashboard />} />
                              <Route path="file/:fileId" element={<FileInfoPage />} />
                          </Route>
                      </Routes>
                  </AuthProvider>
              </BrowserRouter>
          </ThemeProvider>
      </Provider>
  );
}

export default App;