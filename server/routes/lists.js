import express from 'express';
import ListItem from '../models/ListItem.js';
import { protect } from './auth.js';

const router = express.Router();

// Get all items in a specific list for the logged-in user
router.get('/:listType', protect, async (req, res) => {
  try {
    const items = await ListItem.find({ user: req.user._id, listType: req.params.listType });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all unique custom list names for the logged in user
router.get('/custom/names', protect, async (req, res) => {
  try {
    const items = await ListItem.find({ user: req.user._id });
    const standardLists = ['my_movies', 'my_shows', 'favourites'];
    const customNames = [...new Set(items.map(item => item.listType).filter(type => !standardLists.includes(type)))];
    res.json(customNames);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add an item to a list
router.post('/add', protect, async (req, res) => {
  const { tmdbId, mediaType, listType, title, posterPath, releaseDate, genreIds } = req.body;
  
  if (!tmdbId || !mediaType || !listType || !title) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    const existingItem = await ListItem.findOne({ user: req.user._id, tmdbId, listType });
    if (existingItem) {
      return res.status(400).json({ message: 'Item already exists in this list' });
    }

    const newItem = await ListItem.create({
      user: req.user._id,
      tmdbId,
      mediaType,
      listType,
      title,
      posterPath,
      releaseDate,
      genreIds
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove an item from a list
router.delete('/remove/:id', protect, async (req, res) => {
  try {
    const item = await ListItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    if (item.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await item.deleteOne();
    res.json({ message: 'Item removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
