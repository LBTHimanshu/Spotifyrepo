const redirect_uri = 'https://web-comps.webflow.io/home-himanshu';

const clientID = "230d1b5c150d40728def9abdc2f1313f";
const clientSecret = "160578fe6d374cd987a724c10815c2d7";

var access_token = null;
var refresh_token = null;
var currentPlaylist = "";
var deviceID = null;

const AUTHORIZE = "https://accounts.spotify.com/authorize";
const TOKEN = "https://accounts.spotify.com/api/token";
const PLAYLISTS = "https://api.spotify.com/v1/me/playlists";
const DEVICES = "https://api.spotify.com/v1/me/player/devices";
const TRACKS = "https://api.spotify.com/v1/playlists/{{PlaylistId}}/tracks";
const PLAY = "https://api.spotify.com/v1/me/player/play";
const PLAYER = "https://api.spotify.com/v1/me/player";

// function to open and close playlist.
function openPlaylist() {
    let lightIndi = document.querySelector('div[data-pl-btn="playlist"]');
    let playListContainer = document.querySelectorAll(".win-playlist-section");
    playListContainer.forEach(element => {
        let elementArray = element;
        let containerClasses = elementArray.classList;
        if (!containerClasses.contains('show-list')) {
            lightIndi.style.backgroundColor = '#04d708';
            elementArray.classList.add('show-list');
        }
        else if (containerClasses.contains('show-list')) {
            lightIndi.style.backgroundColor = '#044705';
            elementArray.classList.remove('show-list');
        }
    });

}

// function to open and close playlist.
function listenToEvent() {
    let playlistVal;
    let trackVal;
    document.addEventListener('click', (e) => {
        let plBtn = e.target.dataset.plBtn;
        if (plBtn == 'playlist') {
            openPlaylist();
            refreshPlaylists();
        }
        else if (plBtn == "playlistitem") {
            playlistVal = e.target.value;
            fetchTracks(playlistVal);
        }
        else if (plBtn == "trackitem") {
            trackVal = e.target.value;
            play(playlistVal, trackVal);
        }
    })
}

onPageLoad()
function onPageLoad() {
    listenToEvent()
    if (window.location.search.length > 0) {
        handleRedirect();
    }
    else {
        access_token = localStorage.getItem("access_token");
        if (access_token == null) {
            // we don't have an access token so present token section
            requestAuthorization()
        }
        else {
            // we have an access token so present device section
            // currentlyPlaying();
        }
    }
    // refreshRadioButtons();
}

// function to handle redirection.
function handleRedirect() {
    let code = getCode();
    fetchAccessToken(code);
    window.history.pushState("", "", redirect_uri);
}

// function to filter the auth code.
function getCode() {
    let code = null;
    const queryString = window.location.search;
    if (queryString.length > 0) {
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code');
    }
    return code;
}

// function to get the authcode.
function requestAuthorization() {
    let url = AUTHORIZE;
    url += "?client_id=" + clientID;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
    window.location.href = url; // Show Spotify's authorization screen
}

// function to access the access token to call the API methods.
function fetchAccessToken(code) {
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + clientID;
    body += "&client_secret=" + clientSecret;
    callAuthorizationApi(body);
}

// function to get a new token when the current one get expired.
function refreshAccessToken() {
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body) {

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

function handleAuthorizationResponse(data) {
    if (data.access_token != undefined) {
        access_token = data.access_token;
        localStorage.setItem("access_token", access_token);
    }
    if (data.refresh_token != undefined) {
        refresh_token = data.refresh_token;
        localStorage.setItem("refresh_token", refresh_token);
    }
    onPageLoad();
}


// function for calling api's of spotify.
function callAPI(method, url, body, callback) {
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
        then(res => callback(res)).
        catch(error => console.log(error))
}

// function to get the playlists
function refreshPlaylists() {
    callAPI("GET", PLAYLISTS, null, handlePlaylistsResponse);
}

// function to handle playlist
function handlePlaylistsResponse(data) {
    removeAllItems("playlists")
    data.items.forEach(item => addPlaylist(item));
    document.getElementById('playlists').value = currentPlaylist;
}

// function to add playlist item into DOM
function addPlaylist(item) {
    let node = document.createElement("div");
    node.className = "playlist-item";
    node.setAttribute('data-pl-btn', 'playlistitem')
    node.value = item.id;
    node.innerHTML = item.name + " (" + item.tracks.total + ")";
    document.getElementById("playlists").appendChild(node);
}

// function to remove playlist
function removeAllItems(elementId) {
    let node = document.getElementById(elementId);
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

// function to fetch the track based on a playlist.
function fetchTracks(val) {
    let playlist_id = val;
    if (playlist_id.length > 0) {
        url = TRACKS.replace("{{PlaylistId}}", playlist_id);
        callAPI("GET", url, null, handleTracksResponse);
    }
}

// function to handle the tracks.
function handleTracksResponse(data) {
    removeAllItems("tracks");
    data.items.forEach((item, index) => addTrack(item, index));
}

// function to add tracks into DOM.
function addTrack(item, index) {
    let node = document.createElement("div");
    node.value = index;
    node.classList = 'track-item';
    node.setAttribute('data-pl-btn', 'trackitem')
    node.innerHTML = item.track.name + " (" + item.track.artists[0].name + ")";
    document.getElementById("tracks").appendChild(node);
}

// function to play songs
function play(playlistVal, trackVal) {
    refreshDevices()
    let body = {};
    body.context_uri = "spotify:playlist:" + playlistVal;
    body.offset = {};
    body.offset.position = trackVal > 0 ? Number(trackVal) : 0;
    body.offset.position_ms = 0;
    if (deviceID != null) {
        console.log('worked')
        callAPI("PUT", PLAY + "?device_id=" + deviceID, JSON.stringify(body), handleApiResponse);
    }
    else{
        refreshDevices()
    }
}

// handle currently playing song
function handleApiResponse() {
    setTimeout(currentlyPlaying, 2000);
}

// call api to play song selected in tracks
function currentlyPlaying() {
    callAPI("GET", PLAYER + "?market=US", null, handleCurrentlyPlayingResponse);
}

// handle songs.
function handleCurrentlyPlayingResponse(data) {
    console.log(data)
}

// function to hanldle devices.
function refreshDevices() {
    callAPI("GET", DEVICES, null, handleDevicesResponse);
}

function handleDevicesResponse(data) {
    data.devices.forEach(device => {
        if (device.name == "Himanshu's player") {
            deviceID = device.id
        }
    })
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
