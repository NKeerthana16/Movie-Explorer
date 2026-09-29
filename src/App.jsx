import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";
import MovieDetails from "./MovieDetails";
import "./App.css";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Home />} />

        <Route
          path="/movie/:id"
          element={<MovieDetails />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;