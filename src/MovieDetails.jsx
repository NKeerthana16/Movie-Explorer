import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_KEY = "b8dc4437";

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function getMovieDetails() {
      setLoading(true);
      setError("");
      setMovie(null);
      try {
        const params = new URLSearchParams({
          i: id ?? "",
          apikey: API_KEY,
          plot: "full",
        });
        const response = await fetch(
          `https://www.omdbapi.com/?${params}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to load movie details. Please try again.");
        }

        const data = await response.json();
        if (data.Response === "False") {
          throw new Error(data.Error || "Movie details not found.");
        }

        setMovie(data);
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Something went wrong. Please try again."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    getMovieDetails();
    return () => controller.abort();
  }, [id]);

  if (loading) {
    return <p className="loading">Loading movie details...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  return (
    <div className="details-page">

      <button onClick={() => navigate("/")}>
        ← Back
      </button>

      <div className="movie-details">

        {movie.Poster && movie.Poster !== "N/A" ? (
          <img src={movie.Poster} alt={`${movie.Title} poster`} />
        ) : (
          <p className="poster-unavailable">Poster unavailable</p>
        )}

        <div className="details-content">

          <h1>{movie.Title}</h1>

          <p>
            <strong>Year:</strong> {movie.Year}
          </p>

          <p>
            <strong>Genre:</strong> {movie.Genre}
          </p>

          <p>
            <strong>Director:</strong> {movie.Director}
          </p>

          <p>
            <strong>Actors:</strong> {movie.Actors}
          </p>

          <p>
            <strong>Runtime:</strong> {movie.Runtime}
          </p>

          <p>
            <strong>Language:</strong> {movie.Language}
          </p>

          <p>
            <strong>Rating:</strong> ⭐ {movie.imdbRating}
          </p>

          <p>
            <strong>Plot:</strong> {movie.Plot}
          </p>

        </div>

      </div>

    </div>
  );
}

export default MovieDetails;