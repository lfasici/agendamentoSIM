# Sistema de Agendamento Felka

## Overview

This is a logistics scheduling web application built with React, Express, and TypeScript for Felka company. The system allows operators to create available time slots and clients to book appointments for loading/unloading services. It features a modern UI built with shadcn/ui components and Tailwind CSS, branded with the official Felka logo.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Style**: REST API with JSON responses
- **Database**: PostgreSQL with direct connection (production ready)
- **Database ORM**: PostgreSQL native driver for optimal performance
- **Validation**: Zod schemas for type-safe data validation
- **Development**: Hot reload with Vite middleware integration

### Project Structure
```
/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route components
│   │   ├── lib/         # Utility functions
│   │   └── hooks/       # Custom React hooks
├── server/          # Express backend
│   ├── routes.ts    # API route definitions
│   ├── storage.ts   # Data persistence layer
│   └── index.ts     # Server entry point
├── shared/          # Shared TypeScript schemas
└── migrations/      # Drizzle database migrations
```

## Key Components

### Data Models
- **AvailableSlot**: Time slots created by operators with service type and availability status
- **Appointment**: Bookings made by clients with confirmation codes and status tracking

### Core Features
1. **Slot Management**: Operators can create and manage available time slots
2. **Booking System**: Clients can view and book available appointments
3. **Email Notifications**: Confirmation emails (EmailJS integration planned)
4. **Reporting**: Basic analytics and appointment tracking
5. **Responsive Design**: Mobile-first UI with adaptive layouts

### API Endpoints
- `GET /api/slots` - Retrieve available time slots
- `GET /api/slots/date/:date` - Get slots for specific date
- `POST /api/slots` - Create new time slot
- `POST /api/appointments` - Book an appointment
- `GET /api/appointments` - Retrieve appointments (with email filtering)
- `GET /api/stats` - Get booking statistics

## Data Flow

1. **Slot Creation**: Operators create available time slots through the admin interface
2. **Slot Display**: Clients view available slots in a calendar interface
3. **Booking Process**: Clients fill out booking form with contact details
4. **Confirmation**: System generates confirmation code and sends email notification
5. **Status Tracking**: Appointments can be tracked and managed through admin panel

## External Dependencies

### Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **wouter**: Lightweight client-side routing
- **react-hook-form**: Form handling with validation
- **date-fns**: Date manipulation and formatting
- **lucide-react**: Icon library

### Backend Dependencies
- **drizzle-orm**: Type-safe database ORM
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **zod**: Runtime type validation
- **express**: Web framework

### Development Tools
- **vite**: Build tool and dev server
- **typescript**: Type safety
- **tailwindcss**: Utility-first CSS framework
- **eslint & prettier**: Code quality tools

## Deployment Strategy

### Development
- Vite dev server with hot reload
- Express middleware integration for seamless full-stack development
- In-memory storage for rapid prototyping

### Production Ready Features
- Database migrations with Drizzle
- Environment variable configuration
- Build optimization with Vite
- Server-side rendering preparation
- PostgreSQL integration configured

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- Email service configuration (for EmailJS or alternative)

### Build Process
1. `npm run build` - Builds both frontend and backend
2. Frontend builds to `dist/public`
3. Backend bundles to `dist/index.js`
4. `npm start` runs production server

## Database Schema

The application uses Drizzle ORM with PostgreSQL dialect. Key tables:
- **available_slots**: Time slots with service type and availability
- **appointments**: Booking records with client information and status

The schema supports:
- Service types: "Carregamento" (Loading) and "Descarregamento" (Unloading)
- Appointment statuses: "confirmado", "cancelado", "pendente"
- Confirmation codes for booking verification
- Timestamp tracking for all records

## Recent Changes

### July 29, 2025
- **Brand Integration**: Integrated official Felka logo throughout the system
  - Added logo to header replacing truck icon
  - Updated all page titles and branding to "Felka" 
  - Updated print confirmations and documentation
- **Block Functionality**: Added ability to block specific time slots after creating weekly batches
  - Modal interface for selecting and blocking multiple slots
  - Prevents blocked slots from appearing in booking interface
- **XLSX Export**: Replaced CSV export with Excel (XLSX) format
  - Enhanced export with proper column formatting and widths
  - Includes all appointment data fields
- **Print Feature**: Added print functionality to booking confirmation modal
  - Formatted receipt with company branding
  - Opens in new window for easy printing