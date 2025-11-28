/**
 * Service for interacting with the MusicBrainz API and Cover Art Archive API
 * Documentation:
 * - MusicBrainz API: https://musicbrainz.org/doc/MusicBrainz_API
 * - Cover Art Archive API: https://musicbrainz.org/doc/Cover_Art_Archive/API
 */

// Base URLs for APIs
const MUSICBRAINZ_API_BASE_URL = 'https://musicbrainz.org/ws/2';
const COVER_ART_ARCHIVE_API_BASE_URL = 'https://coverartarchive.org';

// User agent is required by MusicBrainz API
// Format: AppName/Version ( Contact )
const USER_AGENT = 'TheGauntlet/1.0 (https://github.com/jwwharrell/the-gauntlet)';

// CORS proxy to avoid CORS issues
const CORS_PROXY = 'https://corsproxy.io/?';

// Interface for album search results
export interface AlbumSearchResult {
  id: string;
  title: string;
  artist: string;
  releaseYear: string;
  coverArtUrl: string | null;
}

// Interface for pagination
export interface PaginatedResults<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * Fetch album artwork from Cover Art Archive
 * @param mbid MusicBrainz ID of the release
 * @returns Promise with URL of the front cover art, or null if not found
 */
export async function fetchAlbumArtwork(mbid: string): Promise<string | null> {
  if (!mbid) {
    return null;
  }

  try {
    // First, try to get the front cover directly
    const frontUrl = `${CORS_PROXY}${encodeURIComponent(`${COVER_ART_ARCHIVE_API_BASE_URL}/release/${mbid}/front-500`)}`;

    // We'll use a HEAD request first to check if the image exists
    const headResponse = await fetch(frontUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    // If the front cover exists, return its URL
    if (headResponse.ok) {
      return frontUrl;
    }

    // If front cover doesn't exist, try to get the list of all images
    const listUrl = `${CORS_PROXY}${encodeURIComponent(`${COVER_ART_ARCHIVE_API_BASE_URL}/release/${mbid}`)}`;

    const listResponse = await fetch(listUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    // If we can't get the list, return null
    if (!listResponse.ok) {
      return null;
    }

    const data = await listResponse.json();

    // Look for the front image or any image if front is not available
    const frontImage = data.images?.find((img: any) => img.front === true);
    const anyImage = data.images?.[0];

    // Return the thumbnail URL of the front image, any image, or null
    if (frontImage && frontImage.thumbnails && frontImage.thumbnails['500']) {
      return `${CORS_PROXY}${encodeURIComponent(frontImage.thumbnails['500'])}`;
    } else if (anyImage && anyImage.thumbnails && anyImage.thumbnails['500']) {
      return `${CORS_PROXY}${encodeURIComponent(anyImage.thumbnails['500'])}`;
    }

    return null;
  } catch (error) {
    console.error('Error fetching album artwork:', error);
    return null;
  }
}

/**
 * Search for albums by name or artist
 * @param query Search query (album name or artist name)
 * @param queryType Optional parameter to specify search type: 'general', 'album', or 'artist'
 * @returns Promise with array of album search results
 */
export async function searchAlbums(
  query: string,
  limit: number = 5,
  offset: number = 0,
  queryType: 'general' | 'album' | 'artist' = 'general'
): Promise<PaginatedResults<AlbumSearchResult>> {
  if (!query.trim()) {
    return {
      items: [],
      total: 0,
      offset,
      limit,
    };
  }

  try {
    console.log(
      `Searching for albums with query: ${query}, type: ${queryType}, limit: ${limit}, offset: ${offset}`
    );

    // Construct the query based on the queryType
    let formattedQuery = query;
    if (queryType === 'album') {
      formattedQuery = `release:"${query}"`;
    } else if (queryType === 'artist') {
      formattedQuery = `artist:"${query}"`;
    }

    // Search for releases (albums) with the query
    const searchUrl = `${CORS_PROXY}${encodeURIComponent(
      `${MUSICBRAINZ_API_BASE_URL}/release/?query=${encodeURIComponent(formattedQuery)}&fmt=json&limit=${limit}&offset=${offset}`
    )}`;

    console.log(`Fetching from URL: ${searchUrl}`);

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`MusicBrainz API error: ${response.status}`);
      throw new Error(`MusicBrainz API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Search results:', data);

    if (!data.releases || !Array.isArray(data.releases)) {
      console.warn('No releases found in response', data);
      return {
        items: [],
        total: 0,
        offset,
        limit,
      };
    }

    // Map the response to our AlbumSearchResult interface
    const albums: AlbumSearchResult[] = await Promise.all(
      data.releases.map(async (release: any) => {
        // Get the artist name
        const artistName = release['artist-credit']?.[0]?.artist?.name || 'Unknown Artist';

        // Get release year if available
        const releaseYear = release.date ? release.date.substring(0, 4) : 'Unknown';

        // Fetch cover art for this release
        const coverArtUrl = await fetchAlbumArtwork(release.id);

        return {
          id: release.id,
          title: release.title || 'Unknown Title',
          artist: artistName,
          releaseYear,
          coverArtUrl,
        };
      })
    );

    console.log('Processed albums:', albums);
    return {
      items: albums,
      total: data.count || albums.length,
      offset,
      limit,
    };
  } catch (error) {
    console.error('Error searching albums:', error);
    throw error;
  }
}

/**
 * Search for albums with combined album name and artist criteria
 * @param albumName Album name to search for
 * @param artistName Artist name to search for
 * @returns Promise with array of album search results
 */
export async function searchAlbumsByNameAndArtist(
  albumName: string,
  artistName: string,
  limit: number = 5,
  offset: number = 0
): Promise<PaginatedResults<AlbumSearchResult>> {
  // Check if at least one search parameter is provided
  if (!albumName.trim() && !artistName.trim()) {
    return {
      items: [],
      total: 0,
      offset,
      limit,
    };
  }

  try {
    console.log(`Searching for albums - Album: "${albumName}", Artist: "${artistName}"`);

    // Construct the query based on provided parameters
    const queryParts = [];

    if (albumName.trim()) {
      queryParts.push(`release:"${albumName.trim()}"`);
    }

    if (artistName.trim()) {
      queryParts.push(`artist:"${artistName.trim()}"`);
    }

    // Join all query parts with AND operator
    const formattedQuery = queryParts.join(' AND ');

    // Search for releases (albums) with the constructed query
    const searchUrl = `${CORS_PROXY}${encodeURIComponent(
      `${MUSICBRAINZ_API_BASE_URL}/release/?query=${encodeURIComponent(formattedQuery)}&fmt=json&limit=${limit}&offset=${offset}`
    )}`;

    console.log(`Fetching from URL: ${searchUrl}`);

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`MusicBrainz API error: ${response.status}`);
      throw new Error(`MusicBrainz API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Search results:', data);

    if (!data.releases || !Array.isArray(data.releases)) {
      console.warn('No releases found in response', data);
      return {
        items: [],
        total: 0,
        offset,
        limit,
      };
    }

    // Map the response to our AlbumSearchResult interface
    const albums: AlbumSearchResult[] = await Promise.all(
      data.releases.map(async (release: any) => {
        // Get the artist name
        const artistName = release['artist-credit']?.[0]?.artist?.name || 'Unknown Artist';

        // Get release year if available
        const releaseYear = release.date ? release.date.substring(0, 4) : 'Unknown';

        // Fetch cover art for this release
        const coverArtUrl = await fetchAlbumArtwork(release.id);

        return {
          id: release.id,
          title: release.title || 'Unknown Title',
          artist: artistName,
          releaseYear,
          coverArtUrl,
        };
      })
    );

    console.log('Processed albums:', albums);
    return {
      items: albums,
      total: data.count || albums.length,
      offset,
      limit,
    };
  } catch (error) {
    console.error('Error searching albums:', error);
    throw error;
  }
}

/**
 * Get detailed information about an album by its MusicBrainz ID
 * @param mbid MusicBrainz ID of the album
 * @returns Promise with detailed album information
 */
export async function getAlbumDetails(mbid: string): Promise<AlbumSearchResult | null> {
  if (!mbid) {
    return null;
  }

  try {
    const url = `${CORS_PROXY}${encodeURIComponent(`${MUSICBRAINZ_API_BASE_URL}/release/${mbid}?fmt=json&inc=artists`)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.status}`);
    }

    const release = await response.json();

    // Get the artist name
    const artistName = release['artist-credit']?.[0]?.artist?.name || 'Unknown Artist';

    // Get release year if available
    const releaseYear = release.date ? release.date.substring(0, 4) : 'Unknown';

    // Fetch cover art
    const coverArtUrl = await fetchAlbumArtwork(release.id);

    return {
      id: release.id,
      title: release.title || 'Unknown Title',
      artist: artistName,
      releaseYear,
      coverArtUrl,
    };
  } catch (error) {
    console.error('Error getting album details:', error);
    throw error;
  }
}
