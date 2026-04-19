# Currency Converter Pro

A full-stack currency converter application with PostgreSQL database integration, user authentication, and advanced features.

## Features

- **Real-time Currency Conversion**: Convert between multiple currencies with live exchange rates
- **Database Caching**: Exchange rates are cached in PostgreSQL for 1 hour to improve performance
- **User Authentication**: Register and login to access personal features
- **Conversion History**: Track all your currency conversions
- **Favorite Pairs**: Save your most used currency pairs for quick access
- **Modern UI**: Built with React and Material-UI for a responsive, user-friendly interface
- **Rate Limiting**: API rate limiting to prevent abuse

## Tech Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- bcryptjs (password hashing)
- jsonwebtoken (authentication)
- express-rate-limit

### Frontend
- React
- Material-UI
- React Router
- Axios

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   npm run install-client
   ```
3. Set up environment variables in `.env`:
   ```
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret
   EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. In another terminal, start the React client:
   ```bash
   cd client && npm start
   ```

## API Endpoints

- `GET /api/rate/:from/:to` - Get exchange rate
- `POST /api/convert` - Convert currency
- `GET /api/history/:userId` - Get conversion history
- `GET /api/favorites/:userId` - Get user favorites
- `POST /api/favorites` - Add favorite pair
- `DELETE /api/favorites/:id` - Remove favorite
- `POST /api/register` - User registration
- `POST /api/login` - User login

## Database Schema

The application uses PostgreSQL with the following tables:
- `users` - User accounts
- `exchange_rates` - Cached exchange rates
- `conversion_history` - User conversion records
- `user_favorites` - User's favorite currency pairs

## Deployment

The app is configured for deployment on platforms like Heroku with the `heroku-postbuild` script that builds the React client.

## License

ISC