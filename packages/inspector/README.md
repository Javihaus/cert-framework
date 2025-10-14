# CERT Inspector

Web-based UI for debugging and visualizing LLM system reliability tests, inspired by MCP Inspector.

## Features

- **Three-Panel Layout**: Tests | Configuration | Results
- **Real-Time Test Execution**: Run tests and see results instantly
- **Visual Diagnostics**: Color-coded pass/fail with detailed evidence
- **Interactive Configuration**: View and configure test parameters
- **History Tracking**: See all test runs with timestamps

## Usage

### Development

```bash
cd packages/inspector
npm install
npm run dev
```

Visit http://localhost:3000

### Production Build

```bash
npm run build
npm start
```

### Integration with CLI

The CLI `cert inspect` command starts the Inspector UI:

```bash
cert inspect --port 3000
```

## Architecture

- **Next.js 14**: App router with React Server Components
- **TypeScript**: Full type safety with @cert/core types
- **Tailwind CSS**: Utility-first styling
- **Real-Time Updates**: Client-side state management

## Components

### TestPanel
Left panel showing all available tests with filtering and search.

### ConfigPanel
Middle panel for viewing/editing test configuration and triggering execution.

### ResultPanel
Right panel displaying test results with:
- Pass/fail status
- Consistency and accuracy metrics
- Diagnostic messages
- Evidence (unique outputs)
- Actionable suggestions

## Future Enhancements

- [ ] Time-series charts for metric trends
- [ ] WebSocket for real-time test streaming
- [ ] Test history pagination
- [ ] Export results to JSON/CSV
- [ ] Dark mode support
