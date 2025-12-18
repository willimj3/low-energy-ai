# Low Energy AI Interface

A web application that demonstrates how users can set preferences to route their AI queries to more efficient models, saving energy and costs when maximum power isn't needed.

## Concept

Not every AI query needs the most powerful model. Simple questions can be handled by smaller, more efficient models that use less energy and cost less money. This interface lets users express their preferences through three dimensions:

- **Efficiency** — How much do you prioritize energy/cost savings?
- **Speed** — How important is response speed?
- **Complexity** — How complex is your task?

Based on these preferences, the app routes queries to the appropriate OpenAI model, from the ultra-efficient GPT-4.1 Nano to the powerful GPT-5.2.

## Models

| Tier | Model | Best For |
|------|-------|----------|
| 1 | GPT-4.1 Nano | Bulk tasks, classification |
| 2 | GPT-4.1 Mini | Fast everyday tasks |
| 3 | o4-mini | Math, coding, reasoning |
| 4 | GPT-4.1 | Complex non-reasoning tasks |
| 5 | GPT-5 Mini | Advanced tasks |
| 6 | GPT-5.2 | Maximum capability |

## Features

- Three preference sliders with real-time model selection
- Direct model picker dropdown
- Live chat with the selected model
- Cost estimates and session savings tracking
- Color-coded UI (green = efficient, red = maximum power)
- Collapsible guide for new users

## Setup

### Prerequisites

- Node.js 18+
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/low-energy-ai.git
cd low-energy-ai

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env and add your OpenAI API key

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with:

```
VITE_OPENAI_API_KEY=your-openai-api-key-here
```

## Tech Stack

- React 18
- Vite
- OpenAI API

## Development

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## License

MIT
