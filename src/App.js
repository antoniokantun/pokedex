// En src/App.js

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PokemonCard from "./PokemonCard";
import PokemonDetails from "./PokemonDetails";
import "./App.css";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

function App() {
  const [pokemons, setPokemons] = useState([]);
  const [currentUrl, setCurrentUrl] = useState(
    "https://pokeapi.co/api/v2/pokemon?limit=24"
  );
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isListLoading, setIsListLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);

  // --- EFECTOS ---

  // 1. useEffect para la PAGINACIÓN (se ejecuta cuando currentUrl cambia)
  useEffect(() => {
    if (!currentUrl) return;

    setIsListLoading(true);
    setError(null);
    setSearchResult(null);

    fetch(currentUrl)
      .then((res) => res.json())
      .then((data) => {
        setPokemons(data.results);
        setNextUrl(data.next);
        setPrevUrl(data.previous);
        setIsListLoading(false);
      })
      .catch((err) => {
        setError("Error al cargar la lista de Pokémon.");
        setIsListLoading(false);
      });
  }, [currentUrl]);

  // 2. ¡NUEVO! useEffect para el BUSCADOR "en vivo" (se ejecuta cuando searchTerm cambia)
  useEffect(() => {
    // Inicia un temporizador
    const timer = setTimeout(() => {
      // Si el término de búsqueda NO está vacío, busca
      if (searchTerm) {
        setIsListLoading(true);
        setError(null);
        setPokemons([]); // Limpiar lista paginada
        setNextUrl(null); // Limpiar paginación
        setPrevUrl(null);
        setCurrentUrl(null); // Detener el useEffect de paginación

        fetch(`https://pokeapi.co/api/v2/pokemon/${searchTerm.toLowerCase()}`)
          .then((res) => {
            if (!res.ok) {
              throw new Error("Pokémon no encontrado");
            }
            return res.json();
          })
          .then((data) => {
            setSearchResult(data);
            setIsListLoading(false);
            enviarNotificacion(data);
          })
          .catch((err) => {
            setError(err.message);
            setSearchResult(null);
            setIsListLoading(false);
          });
      } else {
        // Si el término de búsqueda SÍ ESTÁ VACÍO, resetea a la lista paginada
        setSearchResult(null);
        setError(null);
        // Si no hay una URL actual (porque estábamos en una búsqueda),
        // vuelve a la página 1
        if (!currentUrl) {
          setCurrentUrl("https://pokeapi.co/api/v2/pokemon?limit=24");
        }
      }
    }, 500); // 500ms de espera (puedes ajustar este valor)

    // Función de limpieza:
    // Se ejecuta cada vez que 'searchTerm' cambia (antes del siguiente 'setTimeout')
    // Esto cancela el temporizador anterior, implementando el "debounce"
    return () => clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]); // ¡Esta es la dependencia clave!

  // --- MANEJADORES DE EVENTOS ---

  const goToNextPage = () => {
    if (nextUrl) setCurrentUrl(nextUrl);
  };
  const goToPrevPage = () => {
    if (prevUrl) setCurrentUrl(prevUrl);
  };

  // (La función handleSearch se ha eliminado)

  const fetchAndShowDetails = (id) => {
    setIsLoadingDetails(true);
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedPokemon(data);
        setIsLoadingDetails(false);
        enviarNotificacion(data);
      })
      .catch(() => setIsLoadingDetails(false));
  };

  const handleCloseModal = () => {
    setSelectedPokemon(null);
  };

  // --- RENDERIZACIÓN ---

  const extractIdFromUrl = (url) => {
    return url.split("/")[url.split("/").length - 2];
  };

  // --- NUEVA FUNCIÓN: Pedir permiso ---
  const solicitarPermisoNotificaciones = () => {
    // Revisa si el navegador soporta notificaciones
    if ("Notification" in window) {
      // Pide el permiso
      Notification.requestPermission().then((resultado) => {
        console.log("Permiso de notificación:", resultado);
        if (resultado === "granted") {
          // (Opcional) Puedes mostrar una notificación de bienvenida
          new Notification("¡Notificaciones activadas!", {
            body: "¡Gracias por activar las notificaciones!",
            icon: "/game.png", // O un ícono de pokebola
          });
        }
      });
    }
  };

  // --- NUEVA FUNCIÓN: Enviar mensaje al Service Worker ---
  const enviarNotificacion = async (pokemon, type = "consult") => {
    if ("serviceWorker" in navigator && Notification.permission === "granted") {
      const registration = await navigator.serviceWorker.ready;

      let messageType = "SHOW_CONSULT_NOTIFICATION";
      let bodyText = `¡Has consultado a ${pokemon.name}!`;

      if (type === "capture") {
        messageType = "SHOW_CAPTURE_NOTIFICATION";
        bodyText = `¡Acabas de capturar a ${pokemon.name}!`;
      }

      registration.active.postMessage({
        type: messageType, // El tipo de mensaje
        pokemon: {
          // Los datos para la notificación
          name: pokemon.name,
          icon:
            pokemon.sprites.other["official-artwork"].front_default ||
            pokemon.sprites.front_default,
          body: bodyText,
        },
      });
    }
  };

  // AÑADE esta nueva función en App.js
  const toggleFavorite = (pokemon) => {
    let newFavorites = [...favorites];
    const isFavorite = favorites.some((fav) => fav.id === pokemon.id);

    if (isFavorite) {
      // Liberar (quitar de favoritos)
      newFavorites = newFavorites.filter((fav) => fav.id !== pokemon.id);
    } else {
      // Capturar (añadir a favoritos)
      newFavorites.push(pokemon);
      // ¡Aquí enviamos la notificación de CAPTURA!
      enviarNotificacion(pokemon, "capture");
    }
    setFavorites(newFavorites);
  };

  return (
    <div className="App">
      <h1>Pokédex</h1>

      <button
        onClick={solicitarPermisoNotificaciones}
        className="notify-button"
      >
        Activar notificaciones
      </button>

      {/* --- Buscador (MODIFICADO) --- */}
      {/* Ya no es un <form> y no hay botón */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar Pokémon por nombre"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // Esto actualiza el estado en cada tecla
        />
      </div>

      {/* --- Contenedor de Pokémon (sin cambios) --- */}
      <div className="pokemon-list-wrapper">
        {isListLoading && <div className="loading-spinner">Cargando...</div>}
        {error && <div className="error-message">{error}</div>}

        {searchResult && !isListLoading && (
          <div className="pokemon-container">
            <PokemonCard
              key={searchResult.name}
              name={searchResult.name}
              id={searchResult.id}
              onCardClick={() => setSelectedPokemon(searchResult)}
            />
          </div>
        )}

        {!searchResult && !isListLoading && pokemons.length > 0 && (
          <motion.div
            className="pokemon-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {pokemons.map((p) => {
              const id = extractIdFromUrl(p.url);
              return (
                <PokemonCard
                  key={p.name}
                  name={p.name}
                  id={id}
                  onCardClick={() => fetchAndShowDetails(id)}
                />
              );
            })}
          </motion.div>
        )}
      </div>

      {/* --- Paginación (sin cambios) --- */}
      {!searchResult && !isListLoading && (
        <div className="pagination-container">
          <button onClick={goToPrevPage} disabled={!prevUrl}>
            Anterior
          </button>
          <button onClick={goToNextPage} disabled={!nextUrl}>
            Siguiente
          </button>
        </div>
      )}

      {/* --- Modal (sin cambios) --- */}
      <AnimatePresence>
        {isLoadingDetails && <div className="loading-spinner">Cargando...</div>}
        {selectedPokemon && (
          <PokemonDetails
            pokemon={selectedPokemon}
            onClose={handleCloseModal}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
