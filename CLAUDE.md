# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on port 9002
- `npm run build` - Build production version
- `npm run lint` - Run Next.js linting
- `npm run typecheck` - Run TypeScript type checking
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Start Genkit AI with watch mode

## Architecture Overview

DayView is a Next.js TypeScript application that visualizes daily schedules as dual analog clock diagrams. Key architectural patterns:

### Core Components Structure
- **Clock Diagram System**: Two main clock components (`clock-diagram.tsx` and `clock-diagram-optimized.tsx`) render day/night 12-hour circular diagrams with task segments
- **Task Management**: Tasks are displayed as colored segments on clocks and in a chronological checklist
- **Modal Architecture**: Task creation/editing uses dialog modals with form validation
- **Settings System**: Category management and timezone selection through settings dialog

### Data Flow
- **State Management**: Uses React hooks and Zustand for state management
- **Data Model**: Tasks contain `id`, `name`, `startTime/endTime` (HH:MM format), `categoryName`, and `status` (in progress/completed)
- **Categories**: Have `name` and `color` (hex) properties for visual differentiation
- **Persistence**: LocalStorage for data persistence, with Markdown import/export functionality

### Key Technical Details
- **Time Calculations**: Uses `timeToAngle` utilities to convert time strings to SVG path coordinates
- **SVG Rendering**: Clock diagrams are pure SVG with interactive hover states and tooltips
- **Timezone Support**: Built-in timezone handling using date-fns-tz
- **Responsive Design**: Tailwind CSS with custom Material Design-inspired theme
- **Color System**: Dynamic text color calculation for contrast on colored segments

### Feature Architecture
- **Dual Clock Display**: Day clock (6 AM - 6 PM) and night clock (6 PM - 6 AM) as separate components
- **Interactive Elements**: Clickable segments for editing, hover effects, tooltips, and live time indicator
- **Data Import/Export**: Markdown-based data format for schedule portability
- **Theme Support**: Light/dark mode toggle with system preference detection

### Important File Locations
- Main clock logic: `src/components/clock-diagram.tsx`
- Type definitions: `src/types/index.ts`
- Utility functions: `src/utils/color.ts` (time/angle conversion, color calculations)
- Task components: `src/components/task-dialog.tsx`, `src/components/task-checklist.tsx`
- Custom hooks: `src/hooks/` (file operations, schedule data, mobile detection)