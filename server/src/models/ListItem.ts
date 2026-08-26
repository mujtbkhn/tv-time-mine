import mongoose, { Document } from 'mongoose';

export interface IListItem extends Document {
  user: mongoose.Types.ObjectId;
  tmdbId: string;
  mediaType: 'movie' | 'tv';
  listType: string;
  title: string;
  posterPath?: string;
  releaseDate?: string;
}

const ListItemSchema = new mongoose.Schema<IListItem>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tmdbId: { type: String, required: true },
  mediaType: { type: String, enum: ['movie', 'tv'], required: true },
  listType: { type: String, required: true },
  title: { type: String, required: true },
  posterPath: { type: String },
  releaseDate: { type: String },
}, { timestamps: true });

export default mongoose.model<IListItem>('ListItem', ListItemSchema);
