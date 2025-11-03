import { motion } from "framer-motion";

// Animación para el fondo oscuro
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// Animación para el modal (la tarjeta)
const modalVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
  exit: { opacity: 0, y: 50, scale: 0.8 },
};

const PokemonDetails = ({ pokemon, onClose, favorites, onToggleFavorite }) => {
  const { id, name, sprites, types, stats, abilities } = pokemon;

  // Extraer la imagen principal (usamos 'other' para mejor calidad)
  const imageUrl =
    sprites.other?.["official-artwork"]?.front_default || sprites.front_default;

  const isFavorite = favorites.some((fav) => fav.id === id);

  return (
    // 1. El fondo oscuro (Backdrop)
    <motion.div
      className="modal-backdrop"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={onClose} // Cierra el modal al hacer clic en el fondo
    >
      {/* 2. El contenido del Modal */}
      <motion.div
        className="modal-content"
        variants={modalVariants}
        // Usamos los mismos layoutId que en PokemonCard para la animación
        layoutId={`pokemon-card-${id}`}
        onClick={(e) => e.stopPropagation()} // Evita que el clic se propague al fondo
      >
        <button className="close-button" onClick={onClose}>
          X
        </button>

        <motion.img
          layoutId={`pokemon-image-${id}`}
          src={imageUrl}
          alt={name}
        />
        <h2 className="pokemon-name">{name}</h2>

        <button
          className={`capture-button ${isFavorite ? "favorite" : ""}`}
          onClick={() => onToggleFavorite(pokemon)}
        >
          {isFavorite ? "Liberar" : "¡Capturar!"}
        </button>

        <div className="pokemon-info">
          <div className="info-section">
            <h3>Types</h3>
            <div className="types-container">
              {types.map((typeInfo) => (
                <span
                  key={typeInfo.type.name}
                  className={`type-badge type-${typeInfo.type.name}`}
                >
                  {typeInfo.type.name}
                </span>
              ))}
            </div>
          </div>

          <div className="info-section">
            <h3>Abilities</h3>
            <ul>
              {abilities.map((abilityInfo) => (
                <li key={abilityInfo.ability.name}>
                  {abilityInfo.ability.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="info-section">
            <h3>Stats</h3>
            <ul className="stats-list">
              {stats.map((statInfo) => (
                <li key={statInfo.stat.name}>
                  <span>{statInfo.stat.name}</span>
                  <strong>{statInfo.base_stat}</strong>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar"
                      style={{ width: `${(statInfo.base_stat / 255) * 100}%` }} // 255 es el stat max
                    ></div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PokemonDetails;
