//Define vars
var config = require('./config.json');
var irc = require('irc');
var DiscordClient = require('discord.io');
var Beam = require('beam-client-node');
var BeamSocket = require('beam-client-node/lib/ws');

//Connect to beam server and listen to beam messages all in once
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
          Tbot.say(config.twitch.channel, '[Beam:' + data.user_name + ']' + data.message.message[0].data);
          Dbot.sendMessage({
            to: DChannelId,
            message: '[Beam:' + data.user_name + '] ' + data.message.message[0].data
          });
      }
    });
}).catch(function (err) {
    //If this is a failed request, don't log the entire request. Just log the body
    if(err.message !== undefined && err.message.body !== undefined) {
        err = err.message.body;
    }
    console.log('error joining chat:', err);
});

//Connect to discord server
var Dbot = new DiscordClient({
    autorun: true,
    email: config.discord.email,
    password: config.discord.password
});

//Reconnect to discord server in case of websocket closed
Dbot.on('disconnected', function() {
  Dbot.connect();
});

//Connect to twitch server
var Tbot = new irc.Client('irc.twitch.tv', config.twitch.username, {
  port: 6667,
  channels: [config.twitch.channel],
  debug: false,
  password: config.twitch.oauth,
  username: config.twitch.username
});
Tbot.send('PASS', config.twitch.oauth);

//Get discord channelid
var DChannelId = 0;
Dbot.on('ready', function() {
  for(var counter in Dbot.servers){
    for(var counter1 in Dbot.servers[counter].channels){
      if(Dbot.servers[counter].channels[counter1].name == config.discord.channel && Dbot.servers[counter].channels[counter1].type == 'text'){
        DChannelId = Dbot.servers[counter].channels[counter1].id;
      }
    }
  }
});

//Listens to messages on discord
Dbot.on('message', function(user, userID, channelID, message, rawEvent) {
  if(userID != Dbot.id && channelID == DChannelId){
    Tbot.say(config.twitch.channel, '[Discord:' + user + ']' + message);
    socket.call('msg', ['[Discord:' + user + '] ' + message ]);
  }
  console.log("Discord message! " + message);
});

//Listens to messages from twitch
Tbot.addListener("message", function (from, to, text, message) {
  console.log("Twitch message! " + text);
    Dbot.sendMessage({
      to: DChannelId,
      message: '[Twitch:' + from + '] ' + text
    });
    socket.call('msg', ['[Twitch:' + from + '] ' + text ]);
});
