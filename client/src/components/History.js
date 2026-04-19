import React, { useState, useEffect, useContext } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Alert
} from '@mui/material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const History = () => {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`/api/history/${user.id}`);
      setHistory(response.data);
    } catch (error) {
      setError('Failed to load conversion history');
    }
  };

  if (!user) {
    return (
      <Alert severity="info">
        Please login to view your conversion history.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Conversion History
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Result</TableCell>
              <TableCell>Rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                <TableCell>{item.amount} {item.from_currency}</TableCell>
                <TableCell>{item.from_currency}</TableCell>
                <TableCell>{item.to_currency}</TableCell>
                <TableCell>{item.result.toFixed(2)} {item.to_currency}</TableCell>
                <TableCell>{item.rate_used.toFixed(6)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {history.length === 0 && !error && (
        <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
          No conversion history yet. Start converting currencies!
        </Typography>
      )}
    </Box>
  );
};

export default History;