# Sophrox Polls Backend

Express.js backend API for the Sophrox Polls application.

## Setup

Install dependencies:

```bash
npm install
```

## Development

Start the development server with hot reload:

```bash
npm run dev
```

The server will run on `http://localhost:3000` by default.

## Scripts

- `npm run dev` - Start development server with watch mode
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Type check TypeScript files

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint

## Environment Variables

- `PORT` - Server port (default: 3000)

## Project Structure

```
src/
├── server.ts       # Main server file
```

## Technologies

- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **CORS** - Cross-Origin Resource Sharing
- **tsx** - TypeScript execution for development
