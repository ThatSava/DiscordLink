//Define vars
var config = require('./config.json');
var irc = require('irc');
var DiscordClient = require('discord.io');
var Beam = require('beam-client-node');
var BeamSocket = require('beam-client-node/lib/ws/ws.js');

//Custom prefixes and suffixes
//Suggested by: @apple99er
function getPrefix(service){
    if(config[service].prefix){
        return config[service].prefix;
    }
    else {
        return "[%s:%u]";
    }
}

//Connect to beam server and listen to beam messages all in one
if(config.beam.enabled == "true"){
var beam = new Beam();
var socket;

var BuserID = 0;
var BchannelID = 0;

beam.use('password', {
    username: config.beam.username,
    password: config.beam.password
}).attempt().then(function (res) {
    BuserID = res.body.id;
    return beam.request('get', '/channels/' + config.beam.channel);
}).then(function(res){
    BchannelID = res.body.id;
    return beam.chat.join(res.body.id);
}).then(function (res) {
    var data = res.body;
    socket = new BeamSocket(data.endpoints).boot();
    return socket.call('auth', [BchannelID, BuserID, data.authkey]);
}).then(function(){
    console.log('You are now authenticated!');
    socket.on('ChatMessage', function (data) {
        console.log('Beam message! ' + data.message.message[0].data);
        if(data.user_name != config.beam.username){
          var compiled = '';
          for(i in data.message.message) {
            if (data.message.message[i].type == 'text'){
              compiled = compiled + data.message.message[i].data;
            }else if(data.message.message[i].type == 'link'){
              compiled = compiled + data.message.message[i].text;
            }else if(data.message.message[i].type == 'emoticon'){
              compiled = compiled + data.message.message[i].text;
            }else if(data.message.message[i].type == 'inaspacesuit'){
              compiled = compiled + data.message.message[i].text;
            }
          }
            sendMessages("beam", data.user_name, compiled);
      }
    });

    //Reconnect to beam in case of socket error
    socket.on('closed', function() {
        socket.boot();
    });

}).catch(function (err) {
    //If this is a failed request, don't log the entire request. Just log the body
    if(err.message !== undefined && err.message.body !== undefined) {
        err = err.message.body;
    }
    console.log('error joining chat:', err);
});
}

//Connect to discord server
if(config.discord.enabled) {
    var Dbot = new DiscordClient({
        autorun: true,
        //email: config.discord.email,
        token: config.discord.token
        //password: config.discord.password
    });

//Get discord channelid
    var DChannelId = 0;
    Dbot.on('ready', function () {
        for (var counter in Dbot.servers) {
            for (var counter1 in Dbot.servers[counter].channels) {
                if (Dbot.servers[counter].channels[counter1].name == config.discord.channel && Dbot.servers[counter].channels[counter1].type == 'text') {
                    DChannelId = Dbot.servers[counter].channels[counter1].id;
                }
            }
        }
    });

//Listens to messages on discord
    Dbot.on('message', function (user, userID, channelID, message, rawEvent) {
        if (userID != Dbot.id && channelID == DChannelId) {
            sendMessages("discord", user, Dbot.fixMessage(message));
        }
        console.log("Discord message! " + message);
    });
//Reconnect to discord server in case of websocket closed
    Dbot.on('disconnected', function () {
        Dbot.connect();
    });
}

//Connect to twitch server
if(config.twitch.enabled){
var Tbot = new irc.Client('irc.twitch.tv', config.twitch.username, {
  port: 6667,
  channels: [config.twitch.channel],
  debug: false,
  password: config.twitch.oauth,
  username: config.twitch.username,
  autoRejoin: true
});
Tbot.send('PASS', config.twitch.oauth);

//Listens to messages from twitch
Tbot.addListener("message", function (from, to, text, message) {
  console.log("Twitch message! " + text);
    sendMessages("twitch", from, text);
});
}

//Sends the messages
function sendMessages(from, user, message){
    switch(from) {
        case "beam":
            if (config.twitch.enabled == "true"){
                Tbot.say(config.twitch.channel, getPrefix("twitch").replace("%s", "Twitch").replace("%u", user) + message);
            }
            if(config.discord.enabled == "true"){
                Dbot.sendMessage({
                    to: DChannelId,
                    message: getPrefix("discord").replace("%s", "Discord").replace("%u", user) + message
                });
            }
            break;
        case "twitch":
            if(config.discord.enabled == "true"){
                Dbot.sendMessage({
                    to: DChannelId,
                    message: getPrefix("discord").replace("%s", "Discord").replace("%u", user) + message
                });
            }
            if(config.beam.enabled == "true"){
                socket.call('msg', [getPrefix("beam").replace("%s", "Beam").replace("%u", user) + message ]);
            }
            break;
        case "discord":
            if(config.beam.enabled == "true"){
                socket.call('msg', [getPrefix("beam").replace("%s", "Beam").replace("%u", user) + message ]);
            }
            if (config.twitch.enabled == "true"){
                Tbot.say(config.twitch.channel, getPrefix("twitch").replace("%s", "Twitch").replace("%u", user) + message);
            }
    }
}