import { OPTIONS } from './constants';

const BASE_URL = 'https://api.themoviedb.org/3';

// Helper to get full image URL
export const getImageUrl = (path: string, size: string = 'original') => {
  if (!path) return '';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

export const fetchTrending = async (mediaType: 'movie' | 'tv' | 'all' = 'all') => {
  const response = await fetch(`${BASE_URL}/trending/${mediaType}/day`, OPTIONS);
  const data = await response.json();
  return data.results;
};

export const fetchPopular = async (mediaType: 'movie' | 'tv') => {
  const response = await fetch(`${BASE_URL}/${mediaType}/popular`, OPTIONS);
  const data = await response.json();
  return data.results;
};

export const fetchTopRated = async (mediaType: 'movie' | 'tv') => {
  const response = await fetch(`${BASE_URL}/${mediaType}/top_rated`, OPTIONS);
  const data = await response.json();
  return data.results;
};

export const fetchDiscover = async (mediaType: 'movie' | 'tv', page: number = 1) => {
  const response = await fetch(`${BASE_URL}/discover/${mediaType}?page=${page}&sort_by=popularity.desc`, OPTIONS);
  const data = await response.json();
  return data;
};

export const searchMedia = async (query: string) => {
  if (!query) return [];
  const response = await fetch(`${BASE_URL}/search/multi?query=${encodeURIComponent(query)}`, OPTIONS);
  const data = await response.json();
  return data.results;
};

export const fetchDetails = async (mediaType: 'movie' | 'tv' | 'person', id: string) => {
  const response = await fetch(`${BASE_URL}/${mediaType}/${id}?append_to_response=credits,images,similar`, OPTIONS);
  const data = await response.json();
  return data;
};

export const fetchGenres = async () => {
  try {
    const [movieRes, tvRes] = await Promise.all([
      fetch(`${BASE_URL}/genre/movie/list`, OPTIONS),
      fetch(`${BASE_URL}/genre/tv/list`, OPTIONS)
    ]);
    const movieData = await movieRes.json();
    const tvData = await tvRes.json();
    
    const genreMap: Record<number, string> = {};
    movieData.genres?.forEach((g: any) => genreMap[g.id] = g.name);
    tvData.genres?.forEach((g: any) => genreMap[g.id] = g.name);
    return genreMap;
  } catch (err) {
    console.error("Error fetching genres", err);
    return {};
  }
};

export const fetchSeasonDetails = async (tvId: string, seasonNumber: number) => {
  const response = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNumber}`, OPTIONS);
  const data = await response.json();
  return data;
};
