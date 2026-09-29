import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const API_KEY = "b8dc4437";
const CATEGORIES = ["All", "Action", "Comedy", "Drama", "Horror"];
const STARTER_MOVIE_GROUPS = [
  ["tt0468569", "tt1392190", "tt4154796", "tt0103064"],
  ["tt1119646", "tt0099785", "tt0829482", "tt0377092"],
  ["tt0111161", "tt0109830", "tt0120338", "tt0120689"],
  ["tt0081505", "tt5052448", "tt0084787", "tt0078748"],
];
const STARTER_MOVIE_IDS = [...new Set(STARTER_MOVIE_GROUPS.flat())];

function getRandomStarterMovieIds() {
  const selected = STARTER_MOVIE_GROUPS.map(
    (group) => group[Math.floor(Math.random() * group.length)]
  );
  const remaining = STARTER_MOVIE_IDS.filter((id) => !selected.includes(id));

  for (let index = remaining.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [remaining[index], remaining[randomIndex]] = [
      remaining[randomIndex],
      remaining[index],
    ];
  }

  return [...selected, ...remaining.slice(0, 6)];
}

function Home() {
  const [search, setSearch] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();

    async function loadStarterMovies() {
      try {
        const results = await Promise.all(
          getRandomStarterMovieIds().map(async (imdbID) => {
            try {
              const params = new URLSearchParams({ i: imdbID, apikey: API_KEY });
              const response = await fetch(
                `https://www.omdbapi.com/?${params}`,
                { signal: controller.signal }
              );
              if (!response.ok) {
                return null;
              }

              const data = await response.json();
              return data.Response === "False" ? null : data;
            } catch {
              return null;
            }
          })
        );

        if (controller.signal.aborted) {
          return;
        }

        const starterMovies = results.filter(Boolean);
        if (starterMovies.length === 0) {
          throw new Error("Unable to load movies. Please try again.");
        }

        setMovies(starterMovies);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load movies. Please try again."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadStarterMovies();
    return () => controller.abort();
  }, []);

  async function getMovies() {
    const query = search.trim();
    if (!query) {
      setError("Please enter a movie name.");
      setMovies([]);
      return;
    }

    setLoading(true);
    setError("");
    setActiveCategory("All");

    try {
      const params = new URLSearchParams({ s: query, apikey: API_KEY });
      const response = await fetch(`https://www.omdbapi.com/?${params}`);
      if (!response.ok) {
        throw new Error("Unable to search movies. Please try again.");
      }

      const data = await response.json();
      if (data.Response === "False") {
        throw new Error(data.Error || "Movie not found.");
      }

      setMovies(data.Search || []);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Something went wrong. Please try again."
      );
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }

  async function selectCategory(category) {
    setActiveCategory(category);
    if (
      category === "All" ||
      movies.length === 0 ||
      movies.every((movie) => typeof movie.Genre === "string")
    ) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const moviesWithGenres = await Promise.all(
        movies.map(async (movie) => {
          if (typeof movie.Genre === "string") {
            return movie;
          }

          try {
            const params = new URLSearchParams({
              i: movie.imdbID,
              apikey: API_KEY,
            });
            const response = await fetch(`https://www.omdbapi.com/?${params}`);
            if (!response.ok) {
              return { ...movie, Genre: "" };
            }

            const data = await response.json();
            return {
              ...movie,
              Genre: data.Response === "False" ? "" : data.Genre || "",
            };
          } catch {
            return { ...movie, Genre: "" };
          }
        })
      );
      setMovies(moviesWithGenres);
    } finally {
      setLoading(false);
    }
  }

  const visibleMovies =
    activeCategory === "All"
      ? movies
      : movies.filter((movie) =>
          movie.Genre?.split(",").some(
            (genre) => genre.trim().toLowerCase() === activeCategory.toLowerCase()
          )
        );

  return (
    <div className="app">

      <header>
        <h1>🎬 Movie Explorer</h1>
        <p>Search and explore your favorite movies</p>
      </header>

      <form
        className="search-box"
        onSubmit={(event) => {
          event.preventDefault();
          getMovies();
        }}
      >

        <input
          type="text"
          placeholder="Search for a movie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          Search
        </button>

      </form>

      <div className="categories">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className={activeCategory === category ? "active" : ""}
            aria-pressed={activeCategory === category}
            disabled={loading}
            onClick={() => selectCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="movies">

        <h2>Movies</h2>

        {loading && (
          <p className="loading">
            Loading movies...
          </p>
        )}

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        {!loading &&
          !error &&
          activeCategory !== "All" &&
          movies.length > 0 &&
          visibleMovies.length === 0 && (
            <p>No {activeCategory} movies found in these search results.</p>
          )}

        <div className="movie-list">

          {visibleMovies.map((movie) => (

            <div
              className="movie-card"
              key={movie.imdbID}
            >

              <img
                src={movie.Poster}
                alt={movie.Title}
              />

              <h3>{movie.Title}</h3>

              <p>Year: {movie.Year}</p>

              <button
                onClick={() => navigate(`/movie/${movie.imdbID}`)}
              >
                View Details
              </button>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}

export default Home;