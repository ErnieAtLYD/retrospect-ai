# RetrospectAI Plugin for Obsidian

> AI-powered insights for your daily journals and weekly reviews in Obsidian.

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/ErnieAtLYD/retrospect-ai?style=flat-square)](https://github.com/ErnieAtLYD/retrospect-ai/releases/latest)
[![GitHub all releases](https://img.shields.io/github/downloads/ErnieAtLYD/retrospect-ai/total?style=flat-square)](https://github.com/ErnieAtLYD/retrospect-ai/releases)
[![License](https://img.shields.io/github/license/ErnieAtLYD/retrospect-ai?style=flat-square)](LICENSE)

## Overview

The Retrospect AI Plugin provides thoughtful, AI-powered analysis of your daily journal entries and weekly reviews within Obsidian. It helps identify patterns, track tasks, and offer personalized insights to support your personal growth journey.

![Plugin Screenshot](assets/screenshot.png)

## Features

- **Daily Journal Analysis**: Get insights on individual journal entries, including completed tasks and key takeaways
- **Weekly Synthesis**: Discover patterns and trends across your week with intelligent cross-referencing
- **Privacy-Focused**: Choose between cloud-based or local AI models, with support for private content sections
- **Customizable Output**: Configure the analysis style, detail level, and formatting to suit your preferences
- **Seamless Integration**: Works directly within your existing Obsidian workflow

## Installation

### From Obsidian Community Plugins

1. Open Obsidian
2. Go to Settings → Community plugins
3. Turn off Safe mode
4. Click "Browse" and search for "AI Reflection"
5. Install the plugin and enable it

### Manual Installation

1. Download the latest release from the [releases page](https://github.com/ErnieAtLYD/retrospect-ai/releases)
2. Extract the ZIP file into your Obsidian vault's `.obsidian/plugins` directory
3. Enable the plugin in Obsidian's settings

## Configuration

After installation, you'll need to:

1. Open the plugin settings
2. Add your AI provider API key (if using cloud-based models)
3. Configure your preferred analysis settings
4. Optionally customize the output format

![Settings Screenshot](assets/settings.png)

## Usage

### Analyzing Daily Notes

1. Write your daily journal entry as usual
2. Click the AI Reflection button in the ribbon or use the command palette
3. Review the generated insights at the bottom of your note

### Weekly Analysis

1. Create a weekly note (manually or using Obsidian's templates)
2. Use the "Generate Weekly Analysis" command
3. The plugin will analyze all entries from the current week and provide a synthesis

### Privacy Controls

To mark sections as private (excluded from analysis):

```markdown
:::private
This content won't be analyzed by the AI.
:::
```

## Output Format

The plugin generates structured insights in the following format:

```markdown
## AI Reflection

### 🔍 Insights
- Key takeaways from your entry

### 🚀 Suggestions
- Personalized advice for improvement

### 📌 Unfinished Tasks
- Highlighted incomplete tasks

### 💡 Words of Wisdom
- Productivity tips and motivational notes
```

## API Providers

The plugin currently supports:

- OpenAI (default)
- Self-hosted models (e.g., Ollama)
- *More providers coming soon*

## Development

### Prerequisites

- Node.js and npm
- Obsidian development environment

### Setup

1. Clone this repository
2. Run `npm install`
3. Run `npm run dev` for development build

## Roadmap

- [x] Basic plugin setup and OpenAI integration
- [x] Daily note analysis
- [ ] Weekly synthesis
- [ ] Local AI model support
- [ ] Additional AI provider integrations
- [ ] Enhanced visualization features

See the [project board](https://github.com/ErnieAtLYD/retrospect-ai/projects) for more details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Obsidian](https://obsidian.md/) for the amazing knowledge management system
- The Obsidian community for inspiration and support
- [OpenAI](https://openai.com/) for their API
