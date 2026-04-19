import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Box,
  Alert,
  Chip
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get(`/api/favorites/${user.id}`);
      setFavorites(response.data);
    } catch (error) {
      setError('Failed to load favorites');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user, fetchFavorites]);

  const handleRemoveFavorite = async (id) => {
    try {
      await axios.delete(`/api/favorites/${id}`);
      setFavorites(favorites.filter(fav => fav.id !== id));
    } catch (error) {
      setError('Failed to remove favorite');
    }
  };

  if (!user) {
    return (
      <Alert severity="info">
        Please login to manage your favorite currency pairs.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Favorite Currency Pairs
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper>
        <List>
          {favorites.map((fav) => (
            <ListItem key={fav.id}>
              <ListItemText
                primary={
                  <Chip
                    label={`${fav.from_currency} → ${fav.to_currency}`}
                    variant="outlined"
                    color="primary"
                  />
                }
                secondary={`Added: ${new Date(fav.created_at).toLocaleDateString()}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleRemoveFavorite(fav.id)}
                  color="error"
                >
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      {favorites.length === 0 && !error && (
        <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
          No favorites yet. Add some currency pairs from the converter!
        </Typography>
      )}
    </Box>
  );
};

export default Favorites;