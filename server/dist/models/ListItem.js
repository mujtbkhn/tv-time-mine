import mongoose from 'mongoose';
const ListItemSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tmdbId: { type: String, required: true },
    mediaType: { type: String, enum: ['movie', 'tv'], required: true },
    listType: { type: String, required: true },
    title: { type: String, required: true },
    posterPath: { type: String },
    releaseDate: { type: String },
}, { timestamps: true });
export default mongoose.model('ListItem', ListItemSchema);
