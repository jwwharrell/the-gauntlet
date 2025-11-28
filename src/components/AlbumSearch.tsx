import { useState, FormEvent, ChangeEvent } from 'react';
import { searchAlbumsByNameAndArtist, AlbumSearchResult } from '../services/musicbrainzApi';
import {
  Typography,
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Alert,
  Pagination,
  Stack,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface AlbumSearchProps {
  onAlbumSelect: (album: AlbumSearchResult) => void;
}

export default function AlbumSearch({ onAlbumSelect }: AlbumSearchProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Search inputs
  const [albumName, setAlbumName] = useState('');
  const [artistName, setArtistName] = useState('');

  // Results state
  const [results, setResults] = useState<AlbumSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalResults: 0,
    resultsPerPage: 5,
  });

  const handleSearch = async (e: FormEvent | null, page = 0) => {
    if (e) e.preventDefault();

    // Validate that at least one search field has a value
    if (!albumName.trim() && !artistName.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const offset = page * pagination.resultsPerPage;

      // Use the combined album and artist search
      const paginatedResults = await searchAlbumsByNameAndArtist(
        albumName,
        artistName,
        pagination.resultsPerPage,
        offset
      );

      setResults(paginatedResults.items);
      setPagination({
        ...pagination,
        currentPage: page,
        totalResults: paginatedResults.total,
      });
    } catch (err) {
      setError('Failed to search albums. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage * pagination.resultsPerPage < pagination.totalResults) {
      handleSearch(null, newPage);
    }
  };

  const handleAlbumNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAlbumName(e.target.value);
  };

  const handleArtistNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setArtistName(e.target.value);
  };

  const handleAlbumSelect = (album: AlbumSearchResult) => {
    onAlbumSelect(album);
    setResults([]);
    setAlbumName('');
    setArtistName('');
  };

  return (
    <Box>
      <Typography variant="h2" component="h2" gutterBottom>
        Search Albums
      </Typography>

      <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
        <Typography variant="subtitle1" component="h3" gutterBottom sx={{ fontWeight: 'medium' }}>
          Search by Artist and Album
        </Typography>

        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Artist"
            variant="outlined"
            size="medium"
            value={artistName}
            onChange={handleArtistNameChange}
            placeholder="Enter artist name"
          />
          <TextField
            fullWidth
            label="Album"
            variant="outlined"
            size="medium"
            value={albumName}
            onChange={handleAlbumNameChange}
            placeholder="Enter album name"
          />
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
            sx={{ py: 1.5 }}
            fullWidth
          >
            {isLoading ? 'Searching' : 'Search'}
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {results.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" component="h3" gutterBottom>
            Search Results
          </Typography>

          {isMobile ? (
            // Mobile view - card layout
            <Stack spacing={2}>
              {results.map(album => (
                <Card key={album.id} elevation={1}>
                  <CardActionArea onClick={() => handleAlbumSelect(album)}>
                    <Box sx={{ display: 'flex' }}>
                      <CardMedia
                        component="img"
                        sx={{ width: 80, height: 80 }}
                        image={album.coverArtUrl || '/placeholder-album.jpg'}
                        alt={`${album.title} cover`}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.src = 'https://via.placeholder.com/80?text=No+Cover';
                        }}
                      />
                      <CardContent sx={{ flex: '1 0 auto', py: 1 }}>
                        <Typography component="div" variant="subtitle1" noWrap>
                          {album.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" component="div">
                          {album.artist}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {album.releaseYear}
                        </Typography>
                      </CardContent>
                    </Box>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          ) : (
            // Desktop view - list layout
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {results.map((album, index) => (
                <Box key={album.id}>
                  <ListItem
                    alignItems="flex-start"
                    component="div"
                    onClick={() => handleAlbumSelect(album)}
                    sx={{
                      py: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        src={album.coverArtUrl || 'https://via.placeholder.com/40?text=No+Cover'}
                        alt={`${album.title} cover`}
                        sx={{ width: 56, height: 56 }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={album.title}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {album.artist}
                          </Typography>
                          {` — ${album.releaseYear}`}
                        </>
                      }
                    />
                  </ListItem>
                  {index < results.length - 1 && <Divider variant="inset" component="li" />}
                </Box>
              ))}
            </List>
          )}

          {/* Pagination controls */}
          {pagination.totalResults > pagination.resultsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={Math.ceil(pagination.totalResults / pagination.resultsPerPage)}
                page={pagination.currentPage + 1}
                onChange={(_, page) => handlePageChange(page - 1)}
                disabled={isLoading}
                color="primary"
                size={isMobile ? 'small' : 'medium'}
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
