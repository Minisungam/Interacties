# Interacties

This is my first official individual project!

My goal for this is to create a browser based OBS overlay for a livestream.

The license is quite restrictive (CC BY-NC-ND 4.0) at this point because this project is my baby, but will likely be less restrictive once it matures.

## Features:

- [x] Beat Saber rank pulled from ScoreSaber API
- [x] Heart-rate via Pulsoid WebSocket API (real-time updates)
- [x] Timed animations
- [x] Modular component use based on parameters set on page call
- [x] Settings in a config file
- [x] Chat integration
- [x] User interface to toggle/use interactions and change settings
- [ ] Other interactions done via chat
- [x] Setup instructions

Features and functionality are subject to change.

## Documentation

For detailed documentation including architecture, API reference, and development guide, see the [Knowledge Base](./docs/README.md).

## Installation Requirements:

- Node.JS (latest)

## Setup

First, to get all the files, enter these commands into your command line:

```
# Clone the repository
$ git clone https://github.com/Minisungam/Interacties.git

# Move into the directory
$ cd interacties

# Install dependencies
$ npm install
```

Next, run the command below to create the `config.json` file. Open it in a text editor and fill in your information. You will need a Google API key with access to both the YouTube Data API v3 and the Cloud Text-to-Speech API.

```
# Create the config file from the template
$ cp config_template.json config.json
```

Finally, we can start the server.

```
# Run the development server
$ npm run devStart
```

## Docker Deployment

Interacties is available as an official Docker image. For production deployment:

1. Prepare your configuration:
```bash
cp config_template.json config.json
# Edit config.json with your credentials
```

2. Run the official Docker image:
```bash
docker run -d \
  -p 5500:5500 \
  -v $(pwd)/config.json:/usr/src/interacties/config.json \
  minisungam/interacties:latest
```

Options:
- `-d`: Run in detached mode (background)
- `-p 5500:5500`: Map container port to host
- `-v`: Mount your config file (recommended for security)

Note: Using a volume mount (-v) keeps your credentials out of the container image.

## Docker Compose

For simpler deployment using Docker Compose:

1. Create and configure your `config.json` as shown above
2. Start the container:
```bash
docker-compose up -d
```

To stop:
```bash
docker-compose down
```

The compose file includes:
- Automatic restarts
- Port mapping
- Config file volume mount