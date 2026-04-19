import React, { useState, useEffect, useContext } from 'react';
import {
  Paper,
  TextField,
  Select,
  MenuItem,
  Button,
  Typography,
  Box,
  Alert,
  IconButton,
  Chip
} from '@mui/material';
import { SwapHoriz, Favorite, FavoriteBorder } from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const currencies = [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD',
  'MXN', 'SGD', 'HKD', 'NOK', 'KRW', 'TRY', 'RUB', 'INR', 'BRL', 'ZAR',
  'THB', 'MYR', 'IDR', 'PHP', 'VND'
];

const Converter = () => {
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('THB');
  const [result, setResult] = useState('');
  const [rate, setRate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const response = await axios.get(`/api/favorites/${user.id}`);
      setFavorites(response.data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleConvert = async () => {
    if (!amount || isNaN(amount)) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/convert', {
        amount: parseFloat(amount),
        from: fromCurrency,
        to: toCurrency,
        userId: user?.id
      });

      setResult(response.data.result.toFixed(2));
      setRate(response.data.rate.toFixed(6));
    } catch (error) {
      setError(error.response?.data?.error || 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult('');
    setRate('');
  };

  const handleAddFavorite = async () => {
    if (!user) return;

    try {
      await axios.post('/api/favorites', {
        userId: user.id,
        from: fromCurrency,
        to: toCurrency
      });
      fetchFavorites();
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  };

  const isFavorite = favorites.some(fav =>
    fav.from_currency === fromCurrency && fav.to_currency === toCurrency
  );

  const handleFavoriteClick = (fav) => {
    setFromCurrency(fav.from_currency);
    setToCurrency(fav.to_currency);
    setResult('');
    setRate('');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom align="center">
        Currency Converter
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            sx={{ mr: 2, flex: 1 }}
          />
          <Select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            sx={{ mr: 1, minWidth: 100 }}
          >
            {currencies.map(currency => (
              <MenuItem key={currency} value={currency}>{currency}</MenuItem>
            ))}
          </Select>
          <IconButton onClick={handleSwap} color="primary">
            <SwapHoriz />
          </IconButton>
          <Select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            sx={{ ml: 1, minWidth: 100 }}
          >
            {currencies.map(currency => (
              <MenuItem key={currency} value={currency}>{currency}</MenuItem>
            ))}
          </Select>
          {user && (
            <IconButton onClick={handleAddFavorite} color={isFavorite ? 'error' : 'default'}>
              {isFavorite ? <Favorite /> : <FavoriteBorder />}
            </IconButton>
          )}
        </Box>

        <Button
          variant="contained"
          onClick={handleConvert}
          disabled={loading}
          fullWidth
          sx={{ mb: 2 }}
        >
          {loading ? 'Converting...' : 'Convert'}
        </Button>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {result && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" color="primary">
              {amount} {fromCurrency} = {result} {toCurrency}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Exchange Rate: 1 {fromCurrency} = {rate} {toCurrency}
            </Typography>
          </Box>
        )}
      </Paper>

      {user && favorites.length > 0 && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Favorites
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {favorites.map(fav => (
              <Chip
                key={fav.id}
                label={`${fav.from_currency} → ${fav.to_currency}`}
                onClick={() => handleFavoriteClick(fav)}
                variant="outlined"
              />
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default Converter;