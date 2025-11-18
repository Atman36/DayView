# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DayView is a Next.js TypeScript application that visualizes daily schedules as dual analog clock diagrams. Users can create, edit, and manage tasks shown as colored segments on 12-hour circular clocks (day: 6AM-6PM, night: 6PM-6AM).

## Development Commands

- `npm run dev` - Start development server on port 9002
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run Next.js linting
- `npm run typecheck` - Run TypeScript type checking
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Start Genkit AI with watch mode

## Tech Stack

### Core Technologies
- **Next.js 15.2.3** - React framework with App Router
- **React 18.3.1** - UI library (client-side rendering)
- **TypeScript 5** - Type safety (strict mode enabled)
- **Tailwind CSS 3.4** - Utility-first CSS framework with custom theme
- **Zustand 5.0** - Lightweight state management (not currently in use, but available)

### UI Libraries
- **Radix UI** - Headless UI primitives (dialogs, dropdowns, tooltips, etc.)
- **Shadcn UI** - Pre-built components based on Radix UI
- **Lucide React** - Icon library
- **class-variance-authority** - Component variant management
- **tailwindcss-animate** - Animation utilities

### Data & Utilities
- **date-fns 3.6** & **date-fns-tz 3.2** - Date/time manipulation and timezone support
- **react-hook-form 7.54** - Form state management
- **zod 3.24** - Schema validation
- **uuid** - Unique ID generation

### AI Integration
- **Genkit 1.6** - AI framework
- **@genkit-ai/googleai** - Google AI integration (Gemini 2.0 Flash model)
- API key required: `GOOGLE_GENAI_API_KEY`

## Architecture Overview

### Design Patterns

1. **Client-Side Rendering**: All components use `"use client"` directive
2. **Custom Hooks Pattern**: Business logic extracted into reusable hooks
3. **Component Composition**: UI built from small, focused components
4. **Type-First Development**: Strict TypeScript with explicit type definitions
5. **Controlled Components**: Form inputs managed through react-hook-form
6. **Internationalization**: Translation context with English/Russian support

### Core Components Structure

#### Clock Diagram System
- **Location**: `src/components/clock-diagram.tsx`, `src/components/clock-diagram-optimized.tsx`
- **Purpose**: Render 12-hour circular diagrams with task segments
- **Technology**: Pure SVG with interactive hover states and tooltips
- **Key Features**:
  - Time-based segment rendering using polar coordinates
  - Live time indicator (current hour/minute hand)
  - Click handlers for task editing
  - Hover effects with tooltips
  - Support for tasks crossing midnight boundary

#### Task Management
- **Task Dialog** (`src/components/task-dialog.tsx`): Modal for creating/editing tasks with form validation
- **Task Checklist** (`src/components/task-checklist.tsx`): Chronological list with status toggles
- **Data Flow**: Tasks displayed as colored segments on clocks and in checklist

#### Settings System
- **Location**: `src/components/settings-dialog.tsx`
- **Features**: Category management, timezone selection, theme toggle, language selector, markdown editor
- **UI Improvements**:
  - **Responsive Flexbox Layout**: Controls adapt from vertical (mobile) to horizontal (desktop) layout using `sm:flex-row` breakpoint
  - **Spacing & Padding Consistency**:
    - Major sections: `space-y-6`
    - Subsections: `space-y-3`
    - Control groups: `gap-3` and `gap-2`
  - **Enhanced Category Items**:
    - Hover effects with `hover:bg-accent/50` background transition
    - Smooth `transition-colors` for visual polish
    - Consistent `p-2` padding and `rounded-lg` borders
    - Flex layout with proper alignment (`items-center gap-2`)
  - **Mobile-Friendly Buttons**: Flexible sizing using `flex-1` on mobile, `sm:flex-initial` on desktop
  - **Accessibility**: Removed auto-closing footer button, improved focus states through Tailwind classes

#### Modal Architecture
- Uses Radix UI Dialog primitives
- Form validation with react-hook-form + zod
- Controlled state with callback props for data updates

### Data Flow

#### State Management
- **Primary Pattern**: React hooks (`useState`, `useEffect`, `useCallback`)
- **Custom Hooks**: Centralized business logic
  - `use-schedule-data.ts` - Task/category CRUD operations
  - `use-translation.ts` - i18n state and translations
  - `use-file-operations.ts` - Import/export functionality
  - `use-toast.ts` - Toast notification management
  - `use-mobile.tsx` - Mobile device detection

#### Data Model

**Task Interface** (`src/types/index.ts`):
```typescript
interface Task {
  id: string;                    // Unique identifier
  name: string;                  // Task name
  startTime: string;             // Format: "HH:MM" (24-hour)
  endTime: string;               // Format: "HH:MM" (24-hour)
  categoryName: string;          // References Category.name
  status: string;                // Dynamic based on language (e.g., '⏳ In Progress', '✅ Completed')
}
```

**Category Interface** (`src/types/index.ts`):
```typescript
interface Category {
  name: string;                  // Category name
  color: string;                 // Hex color code (e.g., "#F6A24C")
}
```

#### Data Persistence
- **Primary Storage**: LocalStorage
- **Keys Used**:
  - `scheduleMarkdown` - Serialized schedule data
  - `scheduleTimezone` - Selected timezone
  - `theme` - Light/dark mode preference
  - `language` - Language preference (en/ru)
- **Format**: Markdown-based structure (see Markdown Format section)

### Key Technical Details

#### Time Calculations
- **File**: `src/utils/color.ts`
- **Key Functions**:
  - `timeToAngle(time: string): number` - Converts 24-hour time to 360° angle
  - `timeToAngle12(time: string): number` - Converts to 12-hour clock angle
  - `getSegmentPath(cx, cy, rInner, rOuter, startAngle, endAngle): string` - Generates SVG path for annular sectors
  - `isDarkColor(color: string): boolean` - Determines if hex color needs light text

#### SVG Rendering
- **Clock Structure**: Circular segments (annular sectors) using SVG path elements
- **Coordinate System**: Polar coordinates converted to Cartesian
- **Path Generation**: Arc paths with inner/outer radius for donut-shaped segments
- **Rotation**: 0° at top (12 o'clock), clockwise rotation
- **Special Cases**:
  - Handles midnight crossing (e.g., 22:00-02:00)
  - Prevents duplicate rendering of boundary tasks (17:00-18:00 shown only on day clock)

#### Timezone Support
- **Library**: date-fns-tz
- **Default**: Asia/Yekaterinburg
- **Storage**: Persisted in localStorage
- **Usage**: Applied to current time indicator on clocks

#### Color System
- **Dynamic Text Color**: Calculates perceived brightness to ensure contrast
- **Formula**: `brightness = (r * 299 + g * 587 + b * 114) / 1000`
- **Threshold**: brightness < 128 → use light text
- **Application**: Task segment labels automatically use white or black text

#### Markdown Format
- **Parser/Generator**: `src/utils/markdown.ts`
- **Structure**:
  ```markdown
  # Daily Schedule

  ## Categories
  - Category Name (#HEXCOLOR)

  ## Tasks
  ### HH:MM-HH:MM Task Name
  - Category: Category Name
  - Status: ⏳ In Progress
  ```
- **Bi-lingual Support**: Accepts both English and Russian section headers
- **Error Handling**: Falls back to default schedule if parsing fails

#### Time Constants
- **File**: `src/components/clock-diagram.tsx`
- **Purpose**: Core timing parameters for clock rendering and task display
- **Constants**:
  - `MINUTES_PER_DAY = 1440` - Total minutes in 24 hours
  - `MINUTES_PER_12_HOURS = 720` - Minutes in 12-hour clock (one full clock revolution)
  - `DEFAULT_TASK_DURATION_MINUTES = 120` - Default 2-hour duration when creating new tasks
  - `CURRENT_TIME_UPDATE_INTERVAL_MS = 300000` - Update interval for current time indicator (5 minutes)
- **Usage**: These constants are used for angle calculations, time conversions, and UI updates
- **Note**: Modifying these values affects clock rendering accuracy and task duration defaults

#### Task Name Shortening System
- **File**: `src/constants/task-name-shortening.ts`
- **Purpose**: Abbreviate long task names to fit within SVG clock segments
- **Implementation**: Bilingual dictionary mapping full task names to shortened versions
- **Type**: `Record<string, string>` with 25+ predefined abbreviations
- **Examples**:
  - English: "Learning" → "Learn", "Programming" → "Code"
  - Russian: "программирование" → "код", "изучение английского" → "англ"
- **Usage**: Applied in `clock-diagram.tsx` when rendering task text in constrained SVG space
- **Scope**: Currently focused on Russian task names but extensible for other languages
- **Customization**: Add new mappings directly to the constant object as new task types are created

### Feature Architecture

#### Dual Clock Display
- **Day Clock**: 06:00-18:00 (6 AM - 6 PM)
- **Night Clock**: 18:00-06:00 (6 PM - 6 AM)
- **Task Filtering Logic** (`src/app/page.tsx:89-120`):
  - Day tasks: Start between 6:00-17:59 OR cross into day period
  - Night tasks: Start between 18:00-05:59 OR cross into night period
  - Special case: 17:00-18:00 tasks shown only on day clock

#### Interactive Elements
- **Clickable Segments**: Opens task edit dialog
- **Hover Effects**: Scale transform + tooltip display
- **Tooltips**: Show task name, time range, category
- **Live Time Indicator**: Red hand showing current time (updates based on timezone)

#### Data Import/Export
- **Import**: Hidden file input (`<input type="file" accept=".md">`)
- **Export**: Downloads markdown as .md file
- **Format**: Markdown structure (see above)
- **Validation**: Parsing errors show toast notification

#### Theme Support
- **Modes**: Light, Dark
- **Detection**: Reads system preference on first load
- **Storage**: Persists choice in localStorage
- **Implementation**: CSS classes (`.dark` on `<html>`)
- **Color Variables**: HSL-based custom properties in `src/app/globals.css`

#### Internationalization
- **Languages**: English (en), Russian (ru)
- **Implementation**: React Context (`TranslationContext`)
- **Hook**: `useTranslation()` provides `t` object and `language` state
- **Storage**: Persisted in localStorage
- **Coverage**: All UI strings, default markdown content

### Important File Locations

#### Core Application Files
- **Main Page**: `src/app/page.tsx` - Root component with clock layout
- **Root Layout**: `src/app/layout.tsx` - HTML structure, providers, metadata
- **Global Styles**: `src/app/globals.css` - Tailwind directives, CSS variables

#### Components
- **Main clock logic**: `src/components/clock-diagram.tsx`
- **Optimized clock**: `src/components/clock-diagram-optimized.tsx`
- **Task dialog**: `src/components/task-dialog.tsx`
- **Task checklist**: `src/components/task-checklist.tsx`
- **Settings dialog**: `src/components/settings-dialog.tsx`
- **Theme toggle**: `src/components/theme-toggle.tsx`
- **Translation provider**: `src/components/translation-provider.tsx`
- **UI primitives**: `src/components/ui/*` (Shadcn components)

#### Type Definitions
- **Main types**: `src/types/index.ts` - Task, Category interfaces

#### Utilities
- **Color & time**: `src/utils/color.ts` - Time/angle conversion, color calculations, SVG path generation
- **Markdown**: `src/utils/markdown.ts` - Parse/generate markdown data format
- **Class merging**: `src/lib/utils.ts` - cn() helper for conditional classes

#### Custom Hooks
- **Schedule data**: `src/hooks/use-schedule-data.ts` - Task/category state and CRUD
- **Translation**: `src/hooks/use-translation.ts` - i18n context and hook
- **File operations**: `src/hooks/use-file-operations.ts` - Import/export handlers
- **Toast notifications**: `src/hooks/use-toast.ts` - Toast state management
- **Mobile detection**: `src/hooks/use-mobile.tsx` - Responsive breakpoint detection

#### AI Integration
- **AI instance**: `src/ai/ai-instance.ts` - Genkit configuration
- **Dev server**: `src/ai/dev.ts` - Genkit development entry point

#### Configuration
- **Next.js**: `next.config.ts` - Next.js configuration
- **TypeScript**: `tsconfig.json` - Compiler options (strict mode, path aliases)
- **Tailwind**: `tailwind.config.ts` - Theme customization, plugins
- **Shadcn**: `components.json` - Component library configuration
- **ESLint**: `.eslintrc.json` - Linting rules

## Development Workflows

### Common Tasks

#### Adding a New Task Category
1. Update `src/hooks/use-schedule-data.ts` or use UI (Settings → Category Management)
2. Categories auto-persist to localStorage via markdown generation
3. Color validation: Must be valid 6-digit hex code

#### Modifying Clock Rendering
1. Edit `src/components/clock-diagram.tsx`
2. Understand `getSegmentPath()` for SVG geometry changes
3. Test with tasks crossing midnight boundary
4. Verify both day and night clock rendering

#### Updating Translations
1. Edit `src/hooks/use-translation.ts`
2. Update both `en` and `ru` objects in `translations` constant
3. Add new keys to `Translation` interface
4. Use `useTranslation()` hook in components: `const { t } = useTranslation()`

#### Changing Time Format or Calculations
1. Edit utility functions in `src/utils/color.ts`
2. Test edge cases: midnight crossing, full-day tasks, zero-duration tasks
3. Verify angle calculations for both 12-hour and 24-hour conversions

#### Adding New UI Components
1. Use Shadcn CLI: `npx shadcn-ui@latest add [component-name]`
2. Components install to `src/components/ui/`
3. Follow existing patterns for theming and accessibility

### Testing Approach

#### Type Checking
```bash
npm run typecheck
```
- Runs TypeScript compiler in `--noEmit` mode
- Strict type checking enabled
- Fix all type errors before committing

#### Linting
```bash
npm run lint
```
- Uses Next.js ESLint configuration
- Builds succeed even with lint errors (see `next.config.ts`)
- Fix warnings in development

#### Manual Testing Checklist
- [ ] Create task with various time ranges
- [ ] Edit existing task
- [ ] Delete task
- [ ] Toggle task status
- [ ] Import/export markdown
- [ ] Switch themes (light/dark)
- [ ] Switch languages (EN/RU)
- [ ] Test timezone changes
- [ ] Verify tasks crossing midnight
- [ ] Check responsive layout (mobile/desktop)
- [ ] Test boundary tasks (17:00-18:00)

### Build Process

#### Development Build
```bash
npm run dev
```
- Starts on port 9002
- Hot module replacement enabled
- No dev indicators (configured in `next.config.ts`)

#### Production Build
```bash
npm run build
npm run start
```
- TypeScript errors block build
- ESLint warnings ignored during build
- Optimized bundle output

## Code Conventions

### File Naming
- **Components**: kebab-case (e.g., `clock-diagram.tsx`)
- **Hooks**: kebab-case with `use-` prefix (e.g., `use-schedule-data.ts`)
- **Utilities**: kebab-case (e.g., `color.ts`)
- **Types**: kebab-case (e.g., `index.ts`)

### Import Aliases
- `@/*` maps to `src/*` (configured in `tsconfig.json`)
- Example: `import { Task } from '@/types'`

### Component Patterns
- All components use `"use client"` directive (no server components)
- Props interfaces defined inline or imported from types
- Consistent use of TypeScript for all files

### State Management
- Local state with `useState` for UI-only state
- Custom hooks for business logic and data management
- Callback props for parent-child communication
- LocalStorage for persistence (no external state library currently used)

### Styling
- Tailwind utility classes (no CSS modules)
- Custom theme via Tailwind config and CSS variables
- `cn()` helper from `src/lib/utils.ts` for conditional classes
- Dark mode via `.dark` class on root element

### Error Handling
- Try-catch blocks for localStorage operations
- Toast notifications for user-facing errors
- Console.error for development debugging
- Fallback to default values on parse failures

## Important Notes for AI Assistants

### When Modifying Code

1. **Always preserve existing functionality**: This is a working application
2. **Maintain type safety**: Don't use `any` types
3. **Test time calculations carefully**: Edge cases around midnight are tricky
4. **Update both languages**: Changes to UI text require EN and RU updates
5. **Respect the data model**: Don't change Task/Category interfaces without full refactor
6. **Preserve localStorage keys**: Changing keys breaks existing user data
7. **Maintain SVG path logic**: Clock rendering is mathematically precise

### Common Pitfalls

1. **Midnight Crossing**: Tasks like 22:00-02:00 need special handling
2. **Time Format**: Always "HH:MM" (24-hour), never 12-hour format
3. **Angle Calculations**: 0° is at top (12 o'clock), rotates clockwise
4. **Task Filtering**: Day/night split at 6:00 and 18:00, with overlap logic
5. **Color Validation**: Must be exactly 6-digit hex (e.g., #ABCDEF)
6. **LocalStorage**: Only available client-side, check `typeof window !== 'undefined'`
7. **Translation Keys**: Must exist in both EN and RU objects

### Performance Considerations

- SVG rendering is performant for typical task counts (< 50 tasks)
- LocalStorage operations are synchronous but fast
- No virtualization needed for task list (typical count is low)
- React re-renders optimized via useCallback hooks

### Accessibility

- Semantic HTML used throughout
- `sr-only` classes for screen reader text
- Keyboard navigation supported (native browser behavior)
- Color contrast validated via `isDarkColor()` function
- ARIA labels on interactive elements

### Browser Compatibility

- Modern browsers only (ES2017+)
- LocalStorage required
- SVG support required
- No IE11 support

## AI Integration Details

### Genkit Configuration
- **Model**: Google AI Gemini 2.0 Flash
- **Prompt Directory**: `./prompts` (relative to AI instance)
- **Environment Variable**: `GOOGLE_GENAI_API_KEY`
- **Dev Server**: `npm run genkit:dev`
- **Watch Mode**: `npm run genkit:watch`

### Current AI Usage
- Genkit configured but not actively used in production UI
- Available for future AI-powered features
- Can be used for task suggestions, schedule optimization, etc.

## Deployment Notes

### Environment Variables
- `GOOGLE_GENAI_API_KEY` - Required if using Genkit AI features
- Next.js public env vars: prefix with `NEXT_PUBLIC_`

### Build Configuration
- Target: ES2017
- Output: Standalone (for Docker/serverless)
- Image optimization: Configured for picsum.photos

### Production Checklist
- [ ] Set environment variables
- [ ] Run `npm run typecheck`
- [ ] Run `npm run build`
- [ ] Test production build locally
- [ ] Verify all features work without dev server
- [ ] Check bundle size

## Additional Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Radix UI**: https://www.radix-ui.com/docs
- **Shadcn UI**: https://ui.shadcn.com/
- **date-fns**: https://date-fns.org/docs
- **Genkit**: https://firebase.google.com/docs/genkit

## Project Status

This is an active project with a complete feature set. The codebase is production-ready with:
- Full TypeScript coverage
- Responsive design
- Internationalization (EN/RU)
- Theme support (light/dark)
- Data import/export
- Timezone handling
- Interactive visualizations

Future enhancements could include:
- Recurring tasks
- Multi-day views
- Task templates
- AI-powered scheduling suggestions
- Calendar integration
- Collaboration features
