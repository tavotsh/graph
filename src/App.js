import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import FullMap from "./components/FullMap";
import RelativeMap from "./components/RelativeMap";

function NavigationBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        position: "absolute",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        bgcolor: "rgba(18, 18, 18, 0.9)",
        borderRadius: 2,
        p: 1,
        border: "1px solid #333",
      }}
    >
      <Button
        variant={location.pathname === "/" ? "contained" : "text"}
        onClick={() => navigate("/")}
        sx={{
          color: "#fff",
          bgcolor: location.pathname === "/" ? "#00aaff" : "transparent",
          "&:hover": {
            bgcolor:
              location.pathname === "/"
                ? "#0099cc"
                : "rgba(255, 255, 255, 0.1)",
          },
          textTransform: "none",
          fontWeight: "bold",
        }}
      >
        Full Map
      </Button>
      <Typography sx={{ color: "#fff", mx: 1, fontSize: "18px" }}>|</Typography>
      <Button
        variant={location.pathname === "/relative" ? "contained" : "text"}
        onClick={() => navigate("/relative")}
        sx={{
          color: "#fff",
          bgcolor:
            location.pathname === "/relative" ? "#00aaff" : "transparent",
          "&:hover": {
            bgcolor:
              location.pathname === "/relative"
                ? "#0099cc"
                : "rgba(255, 255, 255, 0.1)",
          },
          textTransform: "none",
          fontWeight: "bold",
        }}
      >
        Relative Map
      </Button>
    </Box>
  );
}

function AppContent() {
  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        bgcolor: "#121212",
        position: "relative",
      }}
    >
      <NavigationBar />
      <Routes>
        <Route path="/" element={<FullMap />} />
        <Route path="/relative" element={<RelativeMap />} />
      </Routes>
    </Box>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
