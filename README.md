# Interacties

This is my first official individual project!

My goal for this is to create a browser based OBS overlay for a livestream.

The license is quite restrictive (CC BY-NC-ND 4.0) at this point because this project is my baby, but will likely be less restrictive once it matures.

## Features:

- [x] Beat Saber rank pulled from ScoreSaber API
- [x] Heart-rate scraped from Pulsoid
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

Next, run the command below to create the config.json file, then open it up in a text editor and fill in your information.

```
# Create the config file from the template
$ cp config_template.json config.json
```

Finally, we can start the server.

```
# Run the development server
$ npm run devStart
```

## Docker

If you're familiar with docker this should be trivial to you but here are some basic steps:

```
# Clone the repository
$ git clone https://github.com/Minisungam/Interacties.git

# Move into the directory
$ cd interacties

# Create the config file from the template
$ cp config_template.json config.json

# Open the config.json file in an editor of your choice and fill in the blanks

# Build the image
$ docker build -t minisungam/interacties .

# Run the container
$ docker run -p 5500:5500 -d minisungam/interacties
```