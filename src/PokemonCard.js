import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 20 }
  }
};

// 1. Recibir onCardClick como prop
const PokemonCard = ({ name, id, onCardClick }) => {
  
  const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

  return (
    <motion.div
      className="pokemon-card"
      variants={cardVariants}
      whileHover={{ scale: 1.1, rotate: 2 }} 
      whileTap={{ scale: 0.95 }}
      
      // El onClick ahora solo llama a la función pasada
      onClick={() => onCardClick()}
      
      // El layoutId ahora usa el 'id'
      layoutId={`pokemon-card-${id}`}
    >
      <motion.img 
        src={imageUrl} 
        alt={name} 
        layoutId={`pokemon-image-${id}`}
      />
      <motion.p>{name}</motion.p>
    </motion.div>
  );
};

export default PokemonCard;