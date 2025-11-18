# DayView: Daily Schedule Visualization Application

DayView is a modern web application for visualizing and managing your daily schedule through intuitive dual analog clock diagrams. The app combines visual time management with practical task organization in a clean, responsive UI with multilingual support (English/Russian).

## Core Features

- **Dual Clock Diagrams**: Visualize your day as two 12-hour circular diagrams (day and night), each showing colored segments for tasks.
- **Interactive Tasks**: Clickable segments, hover effects, and tooltips for quick task details and editing directly on the diagram.
- **Task Checklist**: Chronological list of all tasks with quick status toggling, editing, and deletion.
- **Task Dialog**: Modal for creating and editing tasks with validation.
- **Settings Dialog**: Manage categories, select timezone, theme (light/dark/system), and language (EN/RU).
- **Import/Export**: Save and load your schedule as Markdown files.
- **Multilingual Support**: Full internationalization with English and Russian languages.
- **Responsive & Minimalist Design**: Adapts to all devices, supports light/dark/system theme modes, and follows Material Design color principles.

## Tech Stack

- **Next.js** (React framework)
- **TypeScript** (type safety)
- **Tailwind CSS** (custom Material-inspired theme)
- **Shadcn UI** (dialogs, buttons, form controls)
- **SVG** (for clock diagrams)
- **LocalStorage** (data persistence)
- **date-fns-tz** (timezone support)

## Data Model

- **Task**
  - `id`: Unique identifier
  - `name`: Task name
  - `startTime`, `endTime`: In `HH:MM` format
  - `categoryName`: Category label
  - `status`: In progress or completed
- **Category**
  - `name`: Category name
  - `color`: Hex color code

## UI/UX Highlights

- **Minimalist, modern look**: Clean fonts, dynamic text color for contrast, subtle animations.
- **Interactivity**: Hover effects, tooltips, and smooth segment scaling on hover.
- **Accessibility**: High-contrast colors, keyboard navigation, and responsive layout.
- **Mobile-friendly**: Diagrams and text scale for small screens.
- **Responsive Controls**: Settings dialog adapts from vertical layout (mobile) to horizontal layout (desktop)
- **Polish & Consistency**: Enhanced spacing (`space-y-6`, `gap-3`), hover effects with smooth transitions, and improved visual hierarchy
- **Category Management**: Interactive category items with hover backgrounds and smooth color transitions

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with theme and translation providers
│   └── page.tsx           # Main page component
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── clock-diagram.tsx # Main clock diagram component with time constants
│   ├── settings-dialog.tsx # Settings modal with responsive UI improvements
│   ├── task-dialog.tsx   # Task creation/editing modal
│   ├── task-checklist.tsx # Task list component
│   └── translation-provider.tsx # i18n context provider
├── constants/            # Application constants
│   └── task-name-shortening.ts # Task name abbreviations for SVG display
├── hooks/                 # Custom React hooks
│   ├── use-translation.ts # Translation and language management
│   ├── use-schedule-data.ts # Data management
│   └── use-file-operations.ts # Import/export functionality
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
    ├── color.ts          # Time/angle calculations and color utilities
    └── markdown.ts       # Markdown parsing for data format
```

## Installation and Setup

### Prerequisites

- **Node.js** version 18.0 or higher
- **npm** or **yarn** package manager

### Clone from GitHub

```bash
git clone https://github.com/Atman36/DayView.git
cd dayview
```

### Install Dependencies

```bash
npm install
# or
yarn install
```

### Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser to see the application.

### Build for Production

```bash
npm run build
npm start
# or
yarn build
yarn start
```

### Available Scripts

- `npm run dev` - Start development server on port 9002
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run Next.js linting
- `npm run typecheck` - Run TypeScript type checking
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Start Genkit AI with watch mode

## Core Implementation Details

### Time Constants
The application uses predefined time constants for accurate clock rendering and task management:
- **MINUTES_PER_DAY** (1440) - Total minutes in 24 hours
- **MINUTES_PER_12_HOURS** (720) - Minutes in one 12-hour clock
- **DEFAULT_TASK_DURATION_MINUTES** (120) - Default 2-hour task duration
- **CURRENT_TIME_UPDATE_INTERVAL_MS** (300000) - Updates current time indicator every 5 minutes

See [CLAUDE.md](./CLAUDE.md) for detailed technical information about these constants.

### Task Name Shortening
Long task names are automatically abbreviated to fit within circular clock segments. The system uses a bilingual dictionary of abbreviations (Russian and English) stored in `src/constants/task-name-shortening.ts`. Custom abbreviations can be added to accommodate new task types.

## Data Import/Export

- Data is stored in a Markdown structure (see Data Model above).
- Use the UI buttons to import/export your schedule as `.md` files.

## Customization Tips

- For advanced animations: [Framer Motion](https://www.framer.com/motion/) or [GSAP](https://greensock.com/gsap/)
- For custom tooltips: [Headless UI](https://headlessui.com/), [Radix UI](https://www.radix-ui.com/), [Tippy.js](https://atomiks.github.io/tippyjs/)
- For extended data visualization: [D3.js](https://d3js.org/)
- For responsive design: Tailwind CSS and media queries

## License

MIT
