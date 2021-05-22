require('dotenv').config(); 

const Discord = require("discord.js");
const SpotifyWebApi = require('spotify-web-api-node');

const client = new Discord.Client();
const token = process.env.DISCORD_TOKEN;

const SPOTIFY_URL = 'https://open.spotify.com/album/';

client.once("ready", () => {
	console.log("Ready!");
});

client.login(token); 

client.on("message", async message => {
    if (message.content[0] === '/') {
        const search = message.content.substr(4);

        await initializeSpotify();        
        
        const album = await searchSpotify(search)
        
        if(album){
            const spotifyAlbumUrl = SPOTIFY_URL + album.id; 
            message.channel.send(spotifyAlbumUrl); 
        }
        
    }
});

async function searchSpotify(search){
    const artistName = search.split('-')[0].trim();
    const albumName = search.split('-')[1].replace(/\([^)]*\)/gi,"").trim();
    
    let artist;

    for(let i = 0; i < 10; i++){
        let offSet = i * 50;
        artist = await searchArtist(artistName, offSet);
        if(artist){
            break;
        }
    }

    if (artist){
        for(let i = 0; i < 10; i++){
            let offSet = i * 50;
            album = await searchAlbum(artist, albumName, offSet);
            if(album){
                break;
            }
        }
    }

    if(album){
        return album;
    }

    return null;
}


async function initializeSpotify(){
    this.spotifyApi = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_KEY,
        clientSecret: process.env.SPOTIFY_SECRET_KEY,
    });

    await this.spotifyApi.clientCredentialsGrant().then(
        function(data) {
            this.spotifyApi.setAccessToken(data.body.access_token);
        }
    );
}

async function searchArtist(artistName, offSet){
    let foundArtist = null;

    await this.spotifyApi.searchArtists(artistName,{limit: 50, offset: offSet}).then(function(data){
        const artists = data.body.artists.items;
        for (let artist of artists) {
            if (artist.name.toLowerCase() === artistName.toLowerCase()){
                foundArtist = artist;
                break;
            }
        }
    });

    return foundArtist;
}

async function searchAlbum(artist, albumName, offSet){
    let foundAlbum = null;

    await this.spotifyApi.getArtistAlbums(artist.id,{limit: 50, offset: offSet, album_type: 'album'}).then(function(result){
        const albuns = result.body.items;
        for(let album of albuns){
            if(album.name.replace(/ *\([^)]*\) */g, "").toLowerCase() === albumName.toLowerCase()){
                foundAlbum = album;
                break;
            }
        }
    });
    return foundAlbum;
}