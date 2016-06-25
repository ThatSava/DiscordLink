# DiscordLink
App that links beam.pro chat, twitch chat and discord

## Installation
1. Download this repo and extract if needed `git clone https://github.com/andrejsavikin/DiscordLink.git`
2. Rename config.example to config.json `mv config.example config.json`
3. Generate a bot account on `https://discordapp.com/developers/applications/me/create`
4. Add it to your server by going to `https://discordapp.com/oauth2/authorize?client_id=<ClientID>&scope=bot`
5. Edit config.json with your desired settings(See below for prefix)
6. Install dependencies with `npm install`
7. Run the application `node main.js`
8. Profit

##Dependencies
* [irc](https://www.npmjs.com/package/irc)
* [discord.io](https://www.npmjs.com/package/discord.io)
* [beam-client-node](https://www.npmjs.com/package/beam-client-node)

### Notes
* If there are multiple discord servers that contain a room with the same name, the bot will pick the first one
* At this state beam 2FA is not supported

### Prefix format
* You can define an optional prefix in the settings.
* %s will be replaced with the service name ie. Beam
* %u will be replaced with the user name ie. Sava
* Default format is `[%s:%u]`

### Notable mentions:
* @apple99er for the custom prefix idea