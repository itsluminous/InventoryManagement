# Inventory Management System

A comprehensive inventory management system, featuring real-time tracking, FIFO cost calculation, and comprehensive reporting capabilities.

## 🚀 Features

- **Real-time Inventory Tracking**: Track inventory items with live updates
- **FIFO Cost Calculation**: Accurate cost tracking using First In, First Out method
- **Master Data Management**: Manage item templates and units with image support
- **Image Management**: Upload, crop, and compress item images with WebP conversion
- **Smart Duplicate Detection**: Fuzzy matching to prevent duplicate items with intelligent similarity scoring
- **Comprehensive Reporting**: Detailed reports with trend analysis
- **PWA Support**: Works offline with native app-like experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Material Design**: Beautiful, intuitive interface following Material Design principles
- **Multi-tenant**: Secure data isolation for multiple users
- **Contextual Navigation**: Smart navigation that adapts based on current page

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with TypeScript and App Router
- **UI Library**: Material-UI (MUI) v5 with custom theming
- **Database**: Supabase (PostgreSQL with real-time capabilities and file storage)
- **Authentication**: Supabase Auth with Row Level Security
- **Image Processing**: Client-side compression and WebP conversion with react-easy-crop
- **PWA**: next-pwa with Workbox for service worker management
- **Charts**: Recharts for data visualization
- **Testing**: Jest, React Testing Library, Playwright
- **Code Quality**: ESLint, Prettier, TypeScript

## 📋 Prerequisites

- Node.js 18.x or later
- npm or yarn package manager
- Supabase account (for database and authentication)

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd inventory-management-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Update `.env.local` with your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

### Unit Tests

```bash
npm test                 # Run tests once
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

### End-to-End Tests

```bash
npm run test:e2e         # Run Playwright tests
```

### Type Checking

```bash
npm run type-check       # Check TypeScript types
```

### Linting and Formatting

```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
```

## 🏗️ Build and Deployment

### Production Build

```bash
npm run build            # Create production build
npm start                # Start production server
```

### PWA Features

The application includes Progressive Web App capabilities:

- Offline functionality
- App-like experience on mobile devices
- Push notifications support
- Automatic updates

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   ├── (dashboard)/              # Protected dashboard routes
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # Reusable React components
│   ├── ui/                      # Base UI components
│   ├── forms/                   # Form components
│   └── layout/                  # Layout components
├── lib/                         # Utilities and configurations
│   ├── supabase/               # Supabase client and types
│   ├── theme/                  # Material-UI theme configuration
│   └── utils/                  # Helper functions
└── types/                      # TypeScript type definitions
```

## 🎨 Theming

The application supports both light and dark themes with automatic system preference detection. The theme can be toggled manually and preferences are persisted in localStorage.

### Custom Theme Colors

- **Primary**: Blue (#1976d2 light, #90caf9 dark)
- **Secondary**: Pink (#dc004e light, #f48fb1 dark)
- **Background**: Adaptive based on theme mode

## 🔒 Security

- **Row Level Security (RLS)**: Database-level security ensuring users only access their data
- **Authentication**: Secure email/password authentication with Supabase Auth
- **Data Validation**: Client and server-side validation using Zod schemas
- **HTTPS Only**: All production deployments use HTTPS

## 📊 Database Schema

The application uses four main tables:

- **profiles**: User account information
- **master_items**: Item templates with names, units, and image URLs
- **inventory_transactions**: All inventory movements with FIFO tracking
- **Storage**: Supabase Storage bucket for item images with RLS policies

### New Features Added

#### Image Management System
- **Client-side Image Processing**: Automatic compression to 320px width and WebP conversion
- **Image Cropping**: Professional cropping interface using react-easy-crop library
- **Supabase Storage Integration**: Secure file storage with Row Level Security
- **Image Preview**: Click-to-expand image previews on all pages

#### Smart Duplicate Detection
- **Fuzzy Matching Algorithm**: Advanced similarity detection using Levenshtein distance
- **Multi-algorithm Scoring**: Combines substring, starts-with, word-level, and normalized matching
- **Position-independent Matching**: Detects similar items regardless of word order (e.g., "steel balti" vs "balti steel")
- **Interactive Suggestions**: Clickable chips showing similar items with similarity scores
- **Real-time Feedback**: Triggers after 3+ characters with 40% similarity threshold

#### Enhanced Navigation
- **Contextual Icons**: Shows relevant navigation based on current page
- **Profile Menu Integration**: Dark mode toggle moved to profile menu
- **Smart Layout**: Masterlist icon on inventory page, home icon on masterlist page

## 🚀 Deployment

The application is optimized for deployment on Vercel, Netlify, or any platform supporting Next.js applications.

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
NEXT_PUBLIC_APP_NAME="Inventory Management System"
NEXT_PUBLIC_PWA_ENABLED=true
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation in the `/docs` folder
- Review the test files for usage examples

## 🔄 Development Workflow

1. **Feature Development**: Create feature branches from `develop`
2. **Testing**: Ensure all tests pass before creating PR
3. **Code Quality**: Run linting and formatting checks
4. **Review**: All changes require code review
5. **Deployment**: Automatic deployment on merge to `main`

---

Built with ❤️ for marriage hall businesses to efficiently manage their inventory operations.
