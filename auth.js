const redirect_uri = 'https://web-comps.webflow.io/home-himanshu';

const clientID = "230d1b5c150d40728def9abdc2f1313f";
const clientSecret = "160578fe6d374cd987a724c10815c2d7";

var access_token = null;
var refresh_token = null;
var currentPlaylist = "";

const AUTHORIZE = "https://accounts.spotify.com/authorize";
const TOKEN = "https://accounts.spotify.com/api/token";
const PLAYLISTS = "https://api.spotify.com/v1/me/playlists";
const DEVICESID = "4cbb574964744b9423b533a73aaf5a6645938753";

onPageLoad()
function onPageLoad(){
    if ( window.location.search.length > 0 ){
        handleRedirect();
    }
    else{
        access_token = localStorage.getItem("access_token");
        if ( access_token == null ){
            // we don't have an access token so present token section
            requestAuthorization()
        }
        else {
            // we have an access token so present device section
            refreshPlaylists();
            // currentlyPlaying();
        }
    }
    // refreshRadioButtons();
}

// function to handle redirection.
function handleRedirect(){
    let code = getCode();
    fetchAccessToken(code);
    window.history.pushState("", "", redirect_uri);
}

// function to filter the auth code.
function getCode(){
    let code = null;
    const queryString = window.location.search;
    if(queryString.length > 0){
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code');
    }
    return code;
}

// function to get the authcode.
function requestAuthorization(){
    let url = AUTHORIZE;
    url += "?client_id=" + clientID;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
    window.location.href = url; // Show Spotify's authorization screen
}
// user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private
// function to access the access token to call the API methods.
function fetchAccessToken(code){
    let body = "grant_type=authorization_code";
    body += "&code=" + code; 
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + clientID;
    body += "&client_secret=" + clientSecret;
    callAuthorizationApi(body);
}

// function to get a new token when the current one get expired.
function refreshAccessToken(){
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body){
    
    let encodedIDs = btoa(clientID + ":" + clientSecret);
    let options = {
        method: 'POST',
        headers: {
            'Content-type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + encodedIDs, 
        },
        body: body,
    }

    fetch(TOKEN, options).
    then(res => res.json()).
    then(res => handleAuthorizationResponse(res))
};

// function to handle the auth tokens.

function handleAuthorizationResponse(data){
    if ( data.access_token != undefined ){
        access_token = data.access_token;
        localStorage.setItem("access_token", access_token);
    }
    if ( data.refresh_token  != undefined ){
        refresh_token = data.refresh_token;
        localStorage.setItem("refresh_token", refresh_token);
    }
    onPageLoad();
}


// function for calling api's of spotify.
function callAPI (method, url, body, callback){
    let options = {
        method: method,
        headers: {
            'Content-type': 'application/json',
            'Authorization': 'Bearer ' + access_token, 
        },
        body: body,
    }

    fetch(url, options).
    then(res => res.json()).
    then(res => callback(res))
}

function refreshPlaylists(){
    callAPI( "GET", PLAYLISTS, null, handlePlaylistsResponse );
}

function handlePlaylistsResponse(data){
        console.log(data);
        // removeAllItems( "playlists" );
        // data.items.forEach(item => addPlaylist(item));
        // document.getElementById('playlists').value=currentPlaylist;
}

// initiallizing device
window.onSpotifyWebPlaybackSDKReady = () => {
        // You can now initialize Spotify.Player and use the SDK
        var player = new Spotify.Player({
            name: "Himanshu's player",
            getOAuthToken: callback => {
                // Run code to get a fresh access token
                callback(access_token);
            },
            volume: 0.5
        });
        player.connect().then(success => {
            if (success) {
                console.log('The Web Playback SDK successfully connected to Spotify!');
            }
        })
    };