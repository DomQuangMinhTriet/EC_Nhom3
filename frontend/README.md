# Frontend - React + Vite Application

A modern React-based frontend application built with Vite, featuring a component-driven architecture with routing, API integration, and utilities for scalable development.

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)

### Installation

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install all dependencies:

```bash
npm install
```

This will install the following packages:

- **React 19.2.6** - UI library
- **React Router DOM 7.17.0** - Client-side routing
- **Vite 8.0.12** - Build tool and development server
- Development dependencies for ESLint and code quality

## How to Run

### Development Server

Start the development server with hot module replacement (HMR):

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port).

### Production Build

Build the application for production:

```bash
npm run build
```

This creates an optimized build in the `dist` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

### Linting

Check code quality with ESLint:

```bash
npm run lint
```

## Architecture

### Project Structure

```
src/
├── App.jsx                  # Main application component
├── main.jsx                 # Application entry point
├── index.css               # Global styles
├── App.css                 # App component styles
│
├── api/                    # API integration
│   └── testApi.js         # API client and endpoints
│
├── components/             # Reusable UI components
│   ├── Header.jsx         # Header component
│   └── Footer.jsx         # Footer component
│
├── hooks/                  # Custom React hooks
│   └── useData.js         # Custom hook for data fetching
│
├── layouts/                # Page layouts
│   └── MainLayout.jsx     # Main application layout
│
├── pages/                  # Page components
│   ├── HomePage.jsx       # Home page
│   └── AboutPage.jsx      # About page
│
├── routes/                 # Routing configuration
│   └── AppRoutes.jsx      # Route definitions
│
├── services/               # Business logic services
│   └── dataService.js     # Data service layer
│
└── utils/                  # Utility functions
    └── formatters.js      # Data formatting utilities
```

### Architecture Overview

#### 1. **Pages & Routing** (`pages/`, `routes/`)

- Page components represent full-screen views
- Routes are centralized in `AppRoutes.jsx` using React Router
- Pages are lazy-loaded for better performance

#### 2. **Components** (`components/`)

- Reusable UI components (Header, Footer, etc.)
- Components are isolated and self-contained
- Props-driven for flexibility and reusability

#### 3. **Layouts** (`layouts/`)

- Define common page structure (e.g., MainLayout)
- Wrap pages with consistent headers, footers, sidebars
- Reduce code duplication across pages

#### 4. **Services** (`services/`)

- Business logic layer separate from components
- Handle data manipulation and transformation
- Examples: `dataService.js` for data operations

#### 5. **API** (`api/`)

- HTTP client configuration and API endpoints
- Centralized API calls for the entire application
- Example: `testApi.js` for API communication

#### 6. **Hooks** (`hooks/`)

- Custom React hooks for reusable logic
- Examples: `useData.js` for data fetching patterns
- Promotes code reuse across components

#### 7. **Utils** (`utils/`)

- Pure utility and helper functions
- Data formatting, validation, constants
- Examples: `formatters.js` for formatting data

### Data Flow

```
Pages/Components → Hooks → Services → API → Backend
                    ↓
                Components (UI)
```

1. **Components** render UI and trigger user interactions
2. **Hooks** manage component state and side effects
3. **Services** handle business logic and data transformation
4. **API** communicates with backend
5. **Data** flows back to components for rendering

## Development Workflow

1. Create new pages in `pages/`
2. Define routes in `routes/AppRoutes.jsx`
3. Build reusable components in `components/`
4. Extract logic into `hooks/` and `services/`
5. Use `utils/` for helper functions
6. Make API calls through `api/testApi.js`
7. Use Vite's HMR for instant feedback

## Build Tools & Technologies

- **Vite** - Lightning-fast build tool and dev server
- **React 19** - Modern UI library
- **React Router DOM** - Client-side routing
- **ESLint** - Code quality and consistency
- **Module CSS** - Component-scoped styling

## Notes

- HMR (Hot Module Replacement) is enabled by default in development
- ESLint rules are configured in `eslint.config.js`
- The application uses ES modules (`"type": "module"` in package.json)
