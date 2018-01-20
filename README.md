# DiscordLink
App that links Mixer chat, Twitch chat and Discord

## Installation
1. Download this repo and extract if needed `git clone https://github.com/andrejsavikin/DiscordLink.git`
2. Rename config.example to config.json `mv config.example config.json`
3. Generate a bot account on `https://discordapp.com/developers/applications/me/create`
4. Add it to your server by going to `https://discordapp.com/oauth2/authorize?client_id=<ClientID>&scope=bot`
5. Edit config.json with your desired settings(See below for help)
6. Install dependencies with `npm install`
7. Run the application `node main.js`
8. Profit

##Dependencies
* [irc](https://www.npmjs.com/package/irc)
* [Eris](https://github.com/abalabahaha/eris)
* [beam-client-node](https://www.npmjs.com/package/beam-client-node)

### Notes
* If there are multiple discord servers that contain a room with the same name, the bot will pick the first one
* At this state mixer 2FA is not supported

### Config help
* You can define an optional prefix in the settings(for each service).
* %s will be replaced with the service name ie. Mixer
* %u will be replaced with the user name ie. Sava
* Default prefix format is `[%s:%u]`
* To get discord channel ID, just enable developer options under settings -> appearance. Now you can right-click a channel and simply select copy ID.

### Contact
[![Discord](https://discordapp.com/api/guilds/69730004467986432/widget.png?style=banner4)](https://discord.gg/jBRvWct)
[Trello board](https://trello.com/b/zJv9f0pa)

### Notable mentions:
* @apple99er for the custom prefix idea
