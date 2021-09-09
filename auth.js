// redirect url
const redirect_uri = 'https://web-comps.webflow.io/home-himanshu';

// client credentials
const clientID = "230d1b5c150d40728def9abdc2f1313f";
const clientSecret = "160578fe6d374cd987a724c10815c2d7";

// global variables to store data.
var access_token = null;
var refresh_token = null;
var currentPlaylist = "";
var deviceID = null;
var player;

// urls to call API's for a particular operation.
const AUTHORIZE = "https://accounts.spotify.com/authorize";
const TOKEN = "https://accounts.spotify.com/api/token";
const PLAYLISTS = "https://api.spotify.com/v1/me/playlists";
const DEVICES = "https://api.spotify.com/v1/me/player/devices";
const TRACKS = "https://api.spotify.com/v1/playlists/{{PlaylistId}}/tracks";
const PLAY = "https://api.spotify.com/v1/me/player/play";
const PAUSE = "https://api.spotify.com/v1/me/player/pause";
const NEXT = "https://api.spotify.com/v1/me/player/next";
const PREVIOUS = "https://api.spotify.com/v1/me/player/previous";
const PLAYER = "https://api.spotify.com/v1/me/player";

// function to open and close playlist.
function openPlaylist() {
    // access the light indicator.
    let lightIndi = document.querySelector('div[data-pl-btn="playlist"]');
    // access the playlist section.
    let playListContainer = document.getElementsByClassName("win-playlist-section")[0];
    // storing classlist.
    let containerClasses = playListContainer.classList;

    // check class is not present.
    if (!containerClasses.contains('show-list')) {
        // change the bg color of playlist btn.
        lightIndi.style.backgroundColor = '#04d708';
        // add the class to show the playlist.
        playListContainer.classList.add('show-list');
    }
    // check if class in present.
    else if (containerClasses.contains('show-list')) {
        // change the color of playlist btn.
        lightIndi.style.backgroundColor = '#044705';
        // remove the class to hide the playlist.
        playListContainer.classList.remove('show-list');
    }

}

// function to open trackList.
function openTrackList(val = null) {
    // access the light indicator.
    let lightIndi = document.querySelector('div[data-pl-btn="track"]');
    // access the playlist section.
    let trackListContainer = document.getElementsByClassName("win-track-section")[0];
    // storing classlist.
    let containerClasses = trackListContainer.classList;

    // check class is not present.
    if (!containerClasses.contains('show-list') || val != null) {
        // change the bg color of playlist btn.
        lightIndi.style.backgroundColor = '#04d708';
        // add the class to show the playlist.
        trackListContainer.classList.add('show-list');
    }
    // check if class in present.
    else if (containerClasses.contains('show-list')) {
        // change the color of playlist btn.
        lightIndi.style.backgroundColor = '#044705';
        // remove the class to hide the playlist.
        trackListContainer.classList.remove('show-list');
    }
}

// function to listen btn events.
function listenToEvent() {
    // var's to store the playlist value and track value.
    let playlistVal;
    let trackVal;
    // event listener.
    document.addEventListener('click', (e) => {
        // store the dataset value.
        let plBtn = e.target.dataset.plBtn;
        // check if value is playlist.
        if (plBtn == 'playlist') {
            // call function to show playlist.
            openPlaylist();
            // call function to fetch playlist from API.
            refreshPlaylists();
        }
        // check if value is playlistitem.
        else if (plBtn == "playlistitem") {
            // store the playlistitem value in variable
            playlistVal = e.target.value;
            // call to open track list.
            openTrackList(playlistVal);
            // call function to fetch the tracks.
            fetchTracks(playlistVal);
        }
        // check if track button is clicked
        else if (plBtn == 'track') {
            // call open track function.
            openTrackList();
        }
        // check if value is trackitem.
        else if (plBtn == "trackitem") {
            // store the value in variable.
            trackVal = e.target.value;
            // call function to play song from API.
            play(playlistVal, trackVal);
        }
        // check ie value is pause.
        else if (plBtn == "pause") {
            // call API to pause music.
            player.pause()
        }
        // check ie value is play.
        else if (plBtn == "play") {
            // call API to pause music.
            player.togglePlay()
        }
        // check ie value is next.
        else if (plBtn == "next") {
            // call API to next music.
            player.nextTrack()
        }
        // check ie value is prev.
        else if (plBtn == "prev") {
            // call API to change music.
            player.previousTrack()
        }
    })
}

// on page load first function to load.
onPageLoad()

// function to check access token, call eventlistener function and requestAuth function.
function onPageLoad() {
    // call to eventlistener
    listenToEvent()
    // check if url search length is greater than 0.
    if (window.location.search.length > 0) {
        // call handleRedirect function.
        handleRedirect();
    }
    // if there is no search present, fetch the accessToken from LocalStorage.
    else {
        // fetching the accessToken
        access_token = localStorage.getItem("access_token");
        // check if access token is null.
        if (access_token == null) {
            // request for token.
            requestAuthorization()
        }
    }
}

// function to handle redirection.
function handleRedirect() {
    // filter out the auth code which is present in url by calling getCode.
    let code = getCode();
    // call fetchAccessToken to get the access token by calling API.
    fetchAccessToken(code);
    // on redirection set the url to redirect uri.
    window.history.pushState("", "", redirect_uri);
    // call the eventlistener.
    listenToEvent()
}

// function to filter the auth code.
function getCode() {
    // variable to store the auth code.
    let code = null;
    // filtering the search query from the url.
    const queryString = window.location.search;
    // check the lenght of querystring.
    if (queryString.length > 0) {
        // store the url params.
        const urlParams = new URLSearchParams(queryString);
        // store the code from the params.
        code = urlParams.get('code');
    }
    // return code.
    return code;
}

// function to request for the authcode.
function requestAuthorization() {
    // set the url params to send a request for authorizing the APP.
    let url = AUTHORIZE + "?client_id=" + clientID + "&response_type=code" + "&redirect_uri=" + encodeURI(redirect_uri) + "&show_dialog=true" + "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";

    // Show Spotify's authorization screen
    window.location.href = url;
}

// function to access the access token to call the API methods.
function fetchAccessToken(code) {
    //setup body params to send with API. 
    let body = "grant_type=authorization_code" + "&code=" + code + "&redirect_uri=" + encodeURI(redirect_uri) + "&client_id=" + clientID + "&client_secret=" + clientSecret;

    // function to call auth API.
    callAuthorizationApi(body);
}

// function to get a new token when the current one get expired.
function refreshAccessToken() {
    // access the refresh token from the LocalStorage.
    refresh_token = localStorage.getItem("refresh_token");

    //set body to get the new access token by using this refresh token. 
    let body = "grant_type=refresh_token" + "&refresh_token=" + refresh_token + "&client_id=" + clientID;

    //function to call auth API. 
    callAuthorizationApi(body);
}

// function to call Auth API to get the access token and refresh token.
function callAuthorizationApi(body) {
    // encoding clientID and clientSecret into 64bit format.
    let encodedIDs = btoa(clientID + ":" + clientSecret);
    // setting the params to call API
    let options = {
        method: 'POST',
        headers: {
            'Content-type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + encodedIDs,
        },
        body: body,
    }

    // calling the API.
    fetch(TOKEN, options).
        // res -> json.
        then(res => res.json()).
        // res -> function to handle the response params.
        then(res => handleAuthorizationResponse(res)).
        // error -> console.
        catch(error => console.log(error))
};

// function to handle the res.
function handleAuthorizationResponse(data) {
    // check is access token in not undefined.
    if (data.access_token != undefined) {
        // store the access token into variable.
        access_token = data.access_token;
        // store the token into localstorage
        localStorage.setItem("access_token", access_token);
    }
    // check is refresh token in not undefined.
    if (data.refresh_token != undefined) {
        // store the refresh token into variable.
        refresh_token = data.refresh_token;
        // store the token into localstorage
        localStorage.setItem("refresh_token", refresh_token);
    }
    // call pageload.
    onPageLoad();
}


// function for calling api's of spotify.
function callAPI(method, url, body, callback) {
    // setting up Params to send with API.
    let options = {
        method: method,
        headers: {
            'Content-type': 'application/json',
            'Authorization': 'Bearer ' + access_token,
        },
        body: body,
    }

    // calling the API.
    fetch(url, options).
        then(res => {
            // check response not ok.
            if (res.status === 401) {
                // call refresh function to get a new function.
                refreshAccessToken();
            }
            // check response is 204
            else if (res.status === 204) {
                // return call.
                return;
            }
            // check response is 403
            else if (res.status === 403) {
                // return call.
                return;
            }
            else {
                // response is ok return res.
                return res;
            }
        }).
        // res->json. 
        then(res => {
            // check is res in undefined -> return.
            if (res == undefined) return
            // return json.
            return res.json()
        }).
        // send res to call back function.
        then(res => callback(res)).
        // error -> console.
        catch(error => console.log(error))
}

// function to get the playlists
function refreshPlaylists() {
    // call API to get the playlists.
    callAPI("GET", PLAYLISTS, null, handlePlaylistsResponse);
}

// function to handle playlist
function handlePlaylistsResponse(data) {
    // call to remove the old playlist from table.
    removeAllItems("playlists")
    // loop through the data to get items and send them into addplaylist function.
    data.items.forEach(item => addPlaylist(item));
    // set the playlist to empty.
    document.getElementById('playlists').value = currentPlaylist;
}

// function to add playlist item into DOM
function addPlaylist(item) {
    // create a div.
    let node = document.createElement("div");
    // add classname.
    node.className = "playlist-item";
    // set attribute.
    node.setAttribute('data-pl-btn', 'playlistitem')
    // set the value.
    node.value = item.id;
    // set the inner html.
    node.innerHTML = item.name + " (" + item.tracks.total + ")";
    // append the element into the playlists container.
    document.getElementById("playlists").appendChild(node);
}

// function to remove playlist
function removeAllItems(elementId) {
    // get the node by id.
    let node = document.getElementById(elementId);
    // loop until the firstelement.
    while (node.firstChild) {
        // remove nodes
        node.removeChild(node.firstChild);
    }
}

// function to fetch the track based on a playlist.
function fetchTracks(val) {
    // get the playlist value.
    let playlist_id = val;
    // check the length of the value.
    if (playlist_id.length > 0) {
        // set the url with TRACK url + playlistid
        url = TRACKS.replace("{{PlaylistId}}", playlist_id);
        // call API to get tracks in that playlist.
        callAPI("GET", url, null, handleTracksResponse);
    }
}

// function to handle the tracks.
function handleTracksResponse(data) {
    // remove all the previous tracks.
    removeAllItems("tracks");
    // add new tracks into the tracks section.
    data.items.forEach((item, index) => addTrack(item, index));
}

// function to add tracks into DOM.
function addTrack(item, index) {
    // create a div.
    let node = document.createElement("div");
    // set value to index.
    node.value = index;
    // set class.
    node.classList = 'track-item';
    // set attribute.
    node.setAttribute('data-pl-btn', 'trackitem')
    // set inerHTML
    node.innerHTML = item.track.name + " (" + item.track.artists[0].name + ")";
    // append track into tracks container.
    document.getElementById("tracks").appendChild(node);
}

// function to play songs
function play(playlistVal, trackVal) {
    // body obj.
    let body = {};
    // body param to send the playlist value.
    body.context_uri = "spotify:playlist:" + playlistVal;
    body.offset = {};
    // set the track number.
    body.offset.position = trackVal > 0 ? Number(trackVal) : 0;
    body.offset.position_ms = 0;
    // call API to PLay the track.
    callAPI("PUT", PLAY + "?device_id=" + deviceID, JSON.stringify(body), handleApiResponse);
}

// handle currently playing song
function handleApiResponse() {
    let tracknameBlock = document.getElementsByClassName("song-info")[0];
    tracknameBlock.innerHTML = "";
    // add currently playing status.
    player.addListener('player_state_changed', ({
        duration,
        track_window: { current_track }
    }) => {
        // convert miliseconds into seconds and add the track name + duration into DOM.
        let minutes = Math.floor(duration / 60000);
        let seconds = ((duration % 60000) / 1000).toFixed(0);
        let trackDuration =  seconds == 60 ?(minutes+1) + ":00" :minutes + ":" + (seconds < 10 ? "0" : "") + seconds
        tracknameBlock.innerHTML = `${current_track.name}  ${trackDuration}`;
    });
}

// initiallizing player.
window.onSpotifyWebPlaybackSDKReady = () => {
    player = new Spotify.Player({
        name: "Winamp player",
        getOAuthToken: callback => {
            // Run code to get a fresh access token
            callback(access_token)
        },
        volume: 0.5,
    });
    // listen to initializaion error.
    player.addListener('initialization_error', ({ message }) => {
        console.log(message)
        // if error -> call auth.
        requestAuthorization()
    });
    // listen to auth error.
    player.addListener('authentication_error', ({ message }) => {
        console.log(message)
        // if error -> call auth.
        requestAuthorization()
    });
    // listen to acc. error.
    player.addListener('account_error', ({ message }) => {
        console.log(message)
        // if error -> call auth.
        requestAuthorization()
    });
    // listen to device ready.
    player.addListener('ready', ({ device_id }) => {
        // get the device id and store it in variable.
        deviceID = device_id;
    });
    // connect the player.
    player.connect().then(success => {
        if (success) {
            console.log('The Web Playback SDK successfully connected to Spotify!');
        }
    })
};