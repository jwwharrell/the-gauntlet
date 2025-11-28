import { useState } from 'react';
import { Album, deleteAlbum } from '../services/localAlbumService';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Divider,
  Paper,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  Alert,
  Snackbar,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface AlbumRankingProps {
  rankedAlbums: Album[];
  onRefresh: () => void;
}

export default function AlbumRanking({ rankedAlbums, onRefresh }: AlbumRankingProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Debug: Log the rankedAlbums prop when it changes
  console.log('AlbumRanking received rankedAlbums:', rankedAlbums);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleRemoveAlbum = (album: Album) => {
    try {
      // Use the deleteAlbum function from localAlbumService
      deleteAlbum(album.id);

      // Refresh the list
      onRefresh();
    } catch (error) {
      console.error('Error removing album:', error);
      setErrorMessage('Failed to remove album. Please try again.');
    }
  };

  const handleCloseError = () => {
    setErrorMessage(null);
  };

  return (
    <Box>
      <Typography variant="h2" component="h2" gutterBottom>
        Your Ranked Albums
      </Typography>

      {/* Debug: Show the length of rankedAlbums */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Debug: Number of albums: {rankedAlbums ? rankedAlbums.length : 'undefined'}
      </Typography>

      {!rankedAlbums || rankedAlbums.length === 0 ? (
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            p: 3,
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="body1">
            You haven't ranked any albums yet. Search and add albums to start ranking!
          </Typography>
        </Paper>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Albums are ranked by points: 3 points for a win, 1 point for a draw
          </Typography>

          {isMobile ? (
            // Mobile view - card layout
            <Stack spacing={2}>
              {rankedAlbums.map(album => (
                <Card
                  key={album.id}
                  elevation={1}
                  sx={{
                    position: 'relative',
                    bgcolor: 'background.paper',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', p: 1 }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          zIndex: 1,
                          display: 'flex',
                          gap: 1,
                        }}
                      >
                        <Chip
                          label={`#${album.rank}`}
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                        <Chip label={`${album.points} pts`} color="secondary" size="small" />
                      </Box>

                      <CardMedia
                        component="img"
                        sx={{ width: 80, height: 80 }}
                        image={album.coverArtUrl || 'https://via.placeholder.com/80?text=No+Cover'}
                        alt={`${album.title} cover`}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.src = 'https://via.placeholder.com/80?text=No+Cover';
                        }}
                      />

                      <CardContent sx={{ flex: '1 0 auto', py: 1, pr: 6 }}>
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

                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleRemoveAlbum(album)}
                        aria-label="Remove album"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Stack>
          ) : (
            // Desktop view - list layout
            <List
              sx={{
                width: '100%',
                bgcolor: 'background.paper',
                borderRadius: 1,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {rankedAlbums.map((album, index) => (
                <Box key={album.id}>
                  <ListItem
                    sx={{
                      py: 1,
                      px: 2,
                      bgcolor: 'background.paper',
                      transition: 'background-color 0.2s ease',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                    component="div"
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="Remove album"
                        onClick={() => handleRemoveAlbum(album)}
                        color="secondary"
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: 'primary.main',
                          mr: 1,
                          fontSize: '0.875rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {album.rank}
                      </Avatar>
                      <Chip label={`${album.points} pts`} color="secondary" size="small" />
                    </Box>

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
                  {index < rankedAlbums.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </>
      )}

      <Snackbar open={!!errorMessage} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" variant="filled" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
