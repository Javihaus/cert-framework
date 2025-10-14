# CERT Documentation

Documentation for the CERT Framework - Consistency Evaluation and Reliability Testing for LLM Systems.

## Development

Install dependencies:

```bash
npm install
```

Start dev server:

```bash
npm run dev
```

Build documentation:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

## Structure

```
docs/
├── .vitepress/
│   └── config.ts         # VitePress configuration
├── guide/
│   ├── introduction.md   # What is CERT?
│   ├── quick-start.md    # Get started quickly
│   ├── concepts.md       # Core concepts
│   ├── consistency.md    # Consistency testing
│   ├── accuracy.md       # Accuracy testing
│   ├── pipeline.md       # Pipeline analysis
│   ├── langchain.md      # LangChain integration
│   ├── python.md         # Python usage
│   ├── pytest.md         # pytest plugin
│   ├── cli.md            # CLI tool
│   ├── inspector.md      # Inspector UI
│   ├── storage.md        # Storage options
│   ├── semantic.md       # Semantic comparison
│   ├── custom-rules.md   # Custom rules
│   └── examples.md       # Examples
├── api/
│   ├── core.md           # @cert/core API
│   ├── semantic.md       # @cert/semantic API
│   ├── langchain.md      # @cert/langchain API
│   ├── cli.md            # @cert/cli API
│   └── python.md         # Python API
└── index.md              # Home page
```

## Contributing

To add new documentation:

1. Create a new `.md` file in the appropriate directory
2. Add it to the sidebar in `.vitepress/config.ts`
3. Follow the existing style and format
4. Test locally with `npm run dev`

## Deployment

The documentation is built automatically on push to main and deployed to GitHub Pages.
