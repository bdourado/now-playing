require('dotenv').config(); //import dotenv 
const Discord = require("discord.js"); // imports the discord library
const client = new Discord.Client(); // creates a discord client
const token = process.env.discord_token; // gets your token from the file
const SPOTIFY_URL = 'https://open.spotify.com/album/'; // spotify album url prefix

client.once("ready", () => { // prints "Ready!" to the console once the bot is online
	console.log("Ready!");
});

client.login(token); // starts the bot up

var SpotifyWebApi = require('spotify-web-api-node');

var spotifyApi = new SpotifyWebApi({
    clientId: process.env.spotify_client_id,
    clientSecret: process.env.spotify_client_secret,
});

spotifyApi.clientCredentialsGrant().then(
    function(data) {
        spotifyApi.setAccessToken(data.body['access_token']);
    }
);

function searchSpotify(message){
    if(message.length < 5) return false;

    const search = message.content.substr(4);
    const artistName = search.split('-')[0].trim();
    const albumName = search.split('-')[1].replace(/\([^)]*\)/gi,"").trim();
    
    searchAlbum(message, artistName,albumName);
}

function searchAlbum(message,artistName, albumName){
    spotifyApi.searchArtists(artistName,{limit: 50}).then(function(data){
        if(data.body.artists.total === 0) return false;
        data.body.artists.items.every(artist => {
            spotifyApi.getArtistAlbums(artist.id,{limit: 50}).then(function(result){
                if(result.body.items.length === 0) return false;
                result.body.items.every(album => {
                    let regEx = new RegExp(albumName.toString(), 'gi');
                    if(album.name.match(regEx)){
                        generateSpotifyAlbumLinkByAlbumId(message,album.id)
                        return false;
                    }
                    return true;
                });
            })            
        });
    });
}

function generateSpotifyAlbumLinkByAlbumId(message, id){
    let albumLink = SPOTIFY_URL+id;
    sendMessage(message, albumLink);
}

function sendMessage(message, text){
    message.channel.send(text.toString()); 
}

let commands = new Map();
commands.set("np", searchSpotify);

client.on("message", message => {
    if (message.content[0] === '/') {
        const command = message.content.split(" ")[0].substr(1); // gets the command name
        if (commands.has(command)) { // checks if the map contains the command
            commands.get(command)(message) // runs the command
        }
    }
});