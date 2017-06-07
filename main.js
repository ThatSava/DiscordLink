//Define vars
var config = require('./config.json');
var irc = require('irc');
var Eris = require('eris');
var Beam = require('beam-client-node');
var BeamSocket = require('beam-client-node/lib/ws');
var path = require('path');
var fs = require("fs");

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

//PIDfile
if(config.pidFile != "false"){
    var npid = require('npid');
    if (fs.existsSync(path.resolve(__dirname, config.pidFile))){
        fs.unlink(path.resolve(__dirname, config.pidFile));
    }
    var pid = npid.create(path.resolve(__dirname, config.pidFile));
    pid.removeOnExit();
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
    return socket.auth(BchannelID, BuserID, data.authkey);
}).then(function(){
    console.log('You are now authenticated with beam!');
    socket.on('ChatMessage', function (data) {

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
            }else if(data.message.message[i].type == 'tag'){
              compiled = compiled + data.message.message[i].text;
            }
          }
            console.log('Beam message received! ' + data.user_name + ":" + compiled);
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
if(config.discord.enabled == "true") {
    var Dbot = new Eris(config.discord.token);
    Dbot.connect();
//Get discord channelid
    var DChannelId = config.discord.channelID;

//Listens to messages on discord
    Dbot.on('messageCreate', function (msg) {
        if (msg.author.id != Dbot.user.id && msg.channel.id == DChannelId) {
            sendMessages("discord", msg.author.username, msg.cleanContent?msg.cleanContent:msg.content);
            console.log("Discord message received! " + msg.author.username + ":" + msg.cleanContent?msg.cleanContent:msg.content);
        }
    });
//Reconnect to discord server in case of websocket closed
    Dbot.on('disconnect', function () {
        Dbot.connect();
    });
}

//Connect to twitch server
if(config.twitch.enabled == "true"){
var Tbot = new irc.Client('irc.chat.twitch.tv', config.twitch.username, {
  port: 6667,
  channels: [config.twitch.channel],
  debug: false,
  password: config.twitch.oauth,
  username: config.twitch.username,
  autoRejoin: true
});
Tbot.on("error",function (error) {
    console.log("Twitch error, this should be fine: "+ JSON.stringify(error))
});

//Listens to messages from twitch
Tbot.addListener("message" + config.twitch.channel, function (from, text, message) {
    console.log("Twitch message received! " + text);
    sendMessages("twitch", from, text);
});
Tbot.addListener("action", function (from, to, text, message) {
    if(to == config.twitch.channel){
        console.log("Twitch action received! " + from + ":" + text);
        sendMessages("twitch", from, "*" + text + "*");
    }
});
}

//Hitbox support
if (config.hitbox.enabled == "true"){
    var HitboxClient = require("hitbox-chat-lib");
    var client = new HitboxClient({ username: config.hitbox.username, password: config.hitbox.password });
    client.on("connect", function () {
        console.info("Connected to hibox.");
        var channel1 = client.joinChannel(config.hitbox.channel);
        channel1.on("login", function (name, role) {
            console.info("Logged in to hitbox as " + name + " (" + role + ")");
        }).on("chat", function (name, text, role, params) {
            console.log('Beam message received!' + name + ":" + text);
            if(name != config.hitbox.username) {
                sendMessages("hitbox", name, text);
            }
        }).on("info", function (text, action, params) {
            console.log("Hitbox info" + text + " ("+ action+")");
        });
    }).on("disconnect", function () {
        client = new HitboxClient({ username: config.hitbox.username, password: config.hitbox.password });
    });
}

//Sends the messages
function sendMessages(from, user, message){
    switch(from) {
        case "beam":
            if (config.twitch.enabled == "true"){
                Tbot.say(config.twitch.channel, getPrefix("twitch").replace("%s", "Beam").replace("%u", user) + message);
            }
            if(config.discord.enabled == "true"){
                Dbot.createMessage(DChannelId, getPrefix("discord").replace("%s", "Beam").replace("%u", user) + message);
            }
            if(config.hitbox.enabled == "true") {
                var textMess = getPrefix("hitbox").replace("%s", "Beam").replace("%u", user) + message;
                client.send("chatMsg", {channel:config.hitbox.channel, text:textMess, nameColor: "FF00FF"});//TODO randomize color
            }
            break;
        case "twitch":
            if(config.discord.enabled == "true"){
                Dbot.createMessage(DChannelId, getPrefix("discord").replace("%s", "Twitch").replace("%u", user) + message);
            }
            if(config.beam.enabled == "true"){
                socket.call('msg', [getPrefix("beam").replace("%s", "Twitch").replace("%u", user) + message ]);
            }
            if(config.hitbox.enabled == "true") {
                var textMess = getPrefix("hitbox").replace("%s", "Twitch").replace("%u", user) + message;
                client.send("chatMsg", {channel:config.hitbox.channel, text:textMess, nameColor: "FF00FF"});//TODO randomize color
            }
            break;
        case "discord":
            if(config.beam.enabled == "true"){
                socket.call('msg', [getPrefix("beam").replace("%s", "Discord").replace("%u", user) + message ]);
            }
            if (config.twitch.enabled == "true"){
                Tbot.say(config.twitch.channel, getPrefix("twitch").replace("%s", "Discord").replace("%u", user) + message);
            }
            if(config.hitbox.enabled  == "true") {
                var textMess = getPrefix("hitbox").replace("%s", "Discord").replace("%u", user) + message;
                client.send("chatMsg", {channel:config.hitbox.channel, text:textMess, nameColor: "FF00FF"});//TODO randomize color
            }
            break;
        case "hitbox":
            if(config.beam.enabled == "true"){
                socket.call('msg', [getPrefix("beam").replace("%s", "Hitbox").replace("%u", user) + message ]);
            }
            if (config.twitch.enabled == "true"){
                Tbot.say(config.twitch.channel, getPrefix("twitch").replace("%s", "Hitbox").replace("%u", user) + message);
            }
            if(config.discord.enabled == "true"){
                Dbot.createMessage(DChannelId, getPrefix("discord").replace("%s", "Hitbox").replace("%u", user) + message);
            }
            break;
    }
}
