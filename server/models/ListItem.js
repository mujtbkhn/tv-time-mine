import mongoose from 'mongoose';

const ListItemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tmdbId: { type: String, required: true }, // Using string for flexibility
  mediaType: { type: String, enum: ['movie', 'tv'], required: true },
  listType: { type: String, required: true }, // 'my_movies', 'my_shows', 'favourites', or a custom string like 'Watchlist'
  title: { type: String, required: true }, // Cache title for quick rendering
  posterPath: { type: String }, // Cache poster path
  releaseDate: { type: String }, // Cache release date for sorting
  genreIds: [{ type: Number }], // Cache genres for filtering
}, { timestamps: true });

export default mongoose.model('ListItem', ListItemSchema);
