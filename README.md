# InnovatEPAM Portal

An innovation portal that enables employees to submit ideas and allows administrators to evaluate and manage them through a multi-stage review process with anonymous evaluation, scoring systems, and draft management.

## Features

- **User Management**: Secure registration and login with role-based access (submitters and admins)
- **Idea Submission**: Dynamic submission forms with category-specific fields and multi-file attachments
- **Draft Management**: Save ideas as drafts and edit before final submission
- **Admin Evaluation**: Multi-stage review process with configurable workflows
- **Blind Review**: Anonymous evaluation mode with optional identity reveal after decision
- **Scoring System**: Multi-dimension scoring with aggregation and ranking
- **File Management**: Upload and preview multiple attachments with validation

## Tech Stack

- **Framework**: Next.js 15
- **UI**: React 19 + Tailwind CSS + shadcn/ui components
- **Database**: SQLite with Drizzle ORM
- **Authentication**: Iron Session
- **Testing**: Vitest, React Testing Library, Playwright
- **Form Handling**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS with theme support

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables

Create a .env.local file in the root directory with the following variables:

```
# Database
DATABASE_URL=./data/innovatepam.db

# Session (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=your_generated_secret_here

# Admin seed account
ADMIN_EMAIL=admin@epam.com
ADMIN_PASSWORD=Admin1234!
ADMIN_DISPLAY_NAME=Admin User
```

### 3. Initialize the Database

```bash
# Run migrations
npm run db:migrate

# Seed initial data (creates admin user and sample data)
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |
| `npm test` | Run unit tests with Vitest |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run e2e` | Run end-to-end tests with Playwright |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with initial data |

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── (protected)/       # Protected routes (require login)
│   └── api/               # API routes
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── ideas/            # Idea management components
│   └── ui/               # Reusable UI components
├── actions/              # Server actions
├── lib/                  # Utility functions and helpers
│   ├── auth/            # Authentication utilities
│   ├── db/              # Database configuration
│   └── ideas/           # Idea business logic
├── specs/               # Project specifications and plans
├── tests/               # Test files
└── docs/                # Documentation and ADRs
```

## Development Workflow

1. Create a feature branch
2. Make changes and run tests: `npm test`
3. Check linting: `npm run lint`
4. Verify types: `npm run type-check`
5. Run e2e tests: `npm run e2e`
6. Submit pull request

## Database

The application uses SQLite with Drizzle ORM. Database schema is defined in schema.ts.

### Key Tables
- **users**: User accounts with roles
- **ideas**: Submitted ideas with metadata
- **idea_drafts**: Draft ideas in progress
- **idea_evaluations**: Evaluation results and scores
- **idea_attachments**: File attachments for ideas

## Testing

- **Unit Tests**: `npm test`
- **E2E Tests**: `npm run e2e` (requires running dev server)
- **Coverage**: `npm run test:coverage`

## Documentation

See the docs directory for:
- Architecture Decision Records (ADRs) in adrs
- Project specifications in specs

## Default Login

After seeding:
- **Email**: admin@epam.com
- **Password**: Admin1234!

## License

Proprietary - EPAM
