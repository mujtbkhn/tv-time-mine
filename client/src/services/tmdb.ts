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

  // Detect optional year suffix: "Movie Title *2005"
  const yearMatch = query.match(/\*(\d{4})\s*$/);
  const year = yearMatch ? yearMatch[1] : null;
  const cleanQuery = yearMatch ? query.replace(/\*\d{4}\s*$/, '').trim() : query.trim();

  if (year) {
    // Year was provided — run parallel movie + TV searches with year filter
    const [movieRes, tvRes] = await Promise.all([
      fetch(
        `${BASE_URL}/search/movie?query=${encodeURIComponent(cleanQuery)}&primary_release_year=${year}`,
        OPTIONS
      ),
      fetch(
        `${BASE_URL}/search/tv?query=${encodeURIComponent(cleanQuery)}&first_air_date_year=${year}`,
        OPTIONS
      ),
    ]);
    const movieData = await movieRes.json();
    const tvData = await tvRes.json();

    const movies = (movieData.results || []).map((m: any) => ({ ...m, media_type: 'movie' }));
    const shows = (tvData.results || []).map((t: any) => ({ ...t, media_type: 'tv' }));

    // Merge and sort by popularity descending
    return [...movies, ...shows].sort((a: any, b: any) => (b.popularity ?? 0) - (a.popularity ?? 0));
  }

  // No year — use standard multi-search
  const response = await fetch(`${BASE_URL}/search/multi?query=${encodeURIComponent(cleanQuery)}`, OPTIONS);
  const data = await response.json();
  return data.results;
};

export const fetchDetails = async (mediaType: 'movie' | 'tv' | 'person', id: string) => {
  // For persons, also fetch combined_credits (full filmography with vote_average)
  const appendFields = mediaType === 'person'
    ? 'credits,images,similar,combined_credits'
    : 'credits,images,similar';
  const response = await fetch(`${BASE_URL}/${mediaType}/${id}?append_to_response=${appendFields}`, OPTIONS);
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
