import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';
import toast from 'react-hot-toast';

export interface ListItem {
  _id: string;
  tmdbId: string;
  mediaType: string;
  listType: string;
  title: string;
  posterPath?: string;
  releaseDate?: string;
  genreIds?: number[];
}

interface ListContextType {
  items: ListItem[];
  customListNames: string[];
  loading: boolean;
  isInList: (tmdbId: string, listType: string) => boolean;
  toggleListItem: (itemDetails: any, listType: string) => Promise<void>;
  refreshLists: () => Promise<void>;
}

export const ListContext = createContext<ListContextType>({
  items: [],
  customListNames: [],
  loading: true,
  isInList: () => false,
  toggleListItem: async () => {},
  refreshLists: async () => {},
});

export const ListProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  const fetchAllLists = async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Fetch all lists for the user. We can use the custom lists endpoint approach or a single endpoint.
      // But wait, the backend doesn't have an endpoint for ALL items at once currently.
      // Actually, `/lists/custom/names` fetches all items to get names! Let's check lists.js.
      // Yes, `ListItem.find({ user: req.user._id })` is used in `/custom/names`. 
      // I will need to update lists.js in the backend to add an endpoint that returns all items, 
      // OR I can just make concurrent calls to the standard lists.
      // Let's create an endpoint in backend or just fetch the standard ones.
      
      const { data } = await api.get('/lists/all'); // We'll add this endpoint!
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch all list items", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLists();
  }, [user]);

  const isInList = (tmdbId: string, listType: string) => {
    return items.some(item => item.tmdbId === tmdbId && item.listType === listType);
  };

  const toggleListItem = async (itemDetails: any, listType: string) => {
    if (!user) {
      toast.error("Please login to add to lists");
      return;
    }
    
    const existingItem = items.find(item => item.tmdbId === itemDetails.tmdbId && item.listType === listType);
    
    try {
      if (existingItem) {
        await api.delete(`/lists/remove/${existingItem._id}`);
        setItems(prev => prev.filter(item => item._id !== existingItem._id));
        toast.success(`Removed from ${listType.replace('_', ' ')}`);
      } else {
        const { data } = await api.post('/lists/add', itemDetails);
        setItems(prev => [...prev, data]);
        toast.success(`Added to ${listType.replace('_', ' ')}!`);
      }
    } catch (error: any) {
      if (error.response?.data?.message === 'Item already exists in this list') {
        toast.success(`Synced ${listType.replace('_', ' ')} state!`);
        fetchAllLists();
      } else {
        toast.error(error.response?.data?.message || 'Error updating list');
      }
    }
  };

  const standardLists = ['my_movies', 'my_shows', 'favourites', 'watched'];
  const customListNames = Array.from(new Set(items.map(item => item.listType).filter(type => !standardLists.includes(type))));

  return (
    <ListContext.Provider value={{ items, customListNames, loading, isInList, toggleListItem, refreshLists: fetchAllLists }}>
      {children}
    </ListContext.Provider>
  );
};
