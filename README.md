# DiscordLink
App that links beam.pro chat, twitch chat and discord

## Installation
1. Download and extract
```Bash
git clone https://github.com/andrejsavikin/DiscordLink.git
```
2. Rename config.example to config.json
```Bash
mv config.example config.json
```
3. Edit config.json with your desired settings
4. Run the application
```Bash
node main.js
```
5. Profit

##Dependencies
* [irc](https://www.npmjs.com/package/irc)
* [discord.io](https://www.npmjs.com/package/discord.io)
* [beam-client-node](https://www.npmjs.com/package/beam-client-node)

### Notes
* If there are multiple discord servers that contain the same name the bot will pick the first one
* At this state beam 2FA is not supported
