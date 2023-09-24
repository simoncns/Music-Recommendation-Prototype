//get refs to dom elements
const authCodeOutputElem = document.getElementById('code-output')
const clientIDElem = document.getElementById('client-id')
const redirectURIElem = document.getElementById('redirect-uri')
const getCodeBtn = document.getElementById('begin')
const getTokenBtn = document.getElementById('token')
const tokenOutputElem = document.getElementById('token-output')
const getProfileBtn = document.getElementById('profile')
const searchBtn = document.getElementById('search-button')
const queryInputElem = document.getElementById('query')
const playBtn = document.getElementById('play-button')
const urisInputElem = document.getElementById('uris')
// const inputElems = document.querySelectorAll('input')
const getCodeDetails = document.getElementById('get-code')
const getTokenDetails = document.getElementById('get-token')
const apiOutputElem = document.getElementById('api-output')

let artistName = "";
let artistArray;
const output = document.getElementById('output');

let codeVerifier = generateRandomString(128);



let clientId = localStorage.getItem('clientId')
if (clientId) {
  clientIDElem.value = clientId
}

//let redicrectUri = "http://127.0.0.1:5500/index.html";
let redirectUri = localStorage.getItem('redirectUri')
if (redirectUri) {
redirectURIElem.value = redirectUri
} else {
  redirectURIElem.value = window.location
}

// see if the url has the code in it (in some browsers they annoyingly hide
// the nerdly bits of the url by default, you may have to click in the address bar to see it yourself)
const urlParams = new URLSearchParams(window.location.search);
let code = urlParams.get('code');


// do we already have the access token? auth code?
let token = localStorage.getItem('access_token')
if (token) {
  tokenOutputElem.value = token
  if (code) {
    // if it does have the code, paste it into the corresponding output elem
    // do this in the root of the script so that it happens on load.
    // we expect this to be added to the url after the user permits/rejects our
    // app from accessing their spotify information (which they will do on
    // spotify's page, not ours)
    // in this case, disable? no maybe just de-emphasize the get-code and get-token controls

    console.log('got code! 🙌', code)
    authCodeOutputElem.value = code
  }
  getCodeDetails.removeAttribute("open")
  getTokenDetails.removeAttribute("open")
} else if (code) {
  // if it does have the code, paste it into the corresponding output elem
  // do this in the root of the script so that it happens on load.
  // we expect this to be added to the url after the user permits/rejects our
  // app from accessing their spotify information (which they will do on
  // spotify's page, not ours)
  // in this case, disable? no maybe just de-emphasize the get-code and get-token controls

  console.log('got code! 🙌', code)
  authCodeOutputElem.value = code
  getCodeDetails.removeAttribute("open")
}

// if click getCode, try to get it
getCodeBtn.addEventListener('click', () => {
  if (clientIDElem.value) {
    clientId = clientIDElem.value;
    localStorage.setItem('clientId', clientId)
  }
  if (redirectURIElem.value) {
    redirectUri = redirectURIElem.value;
    localStorage.setItem('redirectUri', redirectUri)
  }
  if (clientId && redirectUri) {
    getAuthCode(clientId, redirectUri)
  }
})

// if click getToken
getTokenBtn.addEventListener('click', () => {
  console.log('clicccccked')
  if (clientIDElem.value) {
    clientId = clientIDElem.value;
  }
  if (redirectURIElem.value) {
    redirectUri = redirectURIElem.value;
  }
  console.log('gettoken', clientId, redirectUri, code)
  if (clientId && redirectUri && code) {
    getToken(clientId, redirectUri, code)
      .then(t => {
        token = t
        tokenOutputElem.value = t
      })
  }
})


var xhr = new XMLHttpRequest();
var url; 
var apiKey = 'dpJe3WyxioUQvpHcnPJxhw==PCYErQegUwSTZqZR';

searchBtn.addEventListener('click', () => {
  if (token && queryInputElem.value) {
    searchSpotify(token, queryInputElem.value)
      .then(results => appendAPIOutput(results))
    
  }
  
})


const celebParent = document.getElementById("celeb");
function appendCeleb(value) {
  celebParent.innerHTML = value;
}

function appendAPIOutput(newVal) {
  apiOutputElem.value = '\n\n' + "Artist Name:" + '\n' + JSON.stringify(newVal) + '\n'
  artistName = newVal;
  // THIS WAS FOR ADDING THE LIST OFF ALL POSSIBLE ARTISTS
  // TO LET THE USER CHOOSE WHICH ONE BUT COULDNT GET IT TO WORK
  //console.log("Artist Array", artistArray)
  //artistArray.forEach((artist) => {
    //console.log(artist.name);
    //const node = document.createTextNode(artist.name + "\n\n" + "|" + "\n")
    //output.appendChild(node);
  //})
}

// a bunch of functions from the spotify example that we'll need
// code verifier 
function generateRandomString(length) {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Code Challenge
function generateCodeChallenge(codeVerifier) {
  function base64encode(string) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(string)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = window.crypto.subtle.digest('SHA-256', data);

  return digest.then(d => base64encode(d));
}

// send user to spotify to permit/deny our app access, success will result
// in an authorization code
function getAuthCode(clientId, redirectUri) {
  return generateCodeChallenge(codeVerifier)
    .then(codeChallenge => {
      localStorage.setItem('code_verifier', codeVerifier);

      let state = generateRandomString(16);

      // NOTE: depending on which spotify API endpoints you wish to access,
      // you may require different "scopes". The scopes are the way Spotify
      // informs the user about what things your app would like permission
      // to do on their behalf in Spotify. 
      // see the list of scopes in the docs: 
      // https://developer.spotify.com/documentation/web-api/concepts/scopes#list-of-scopes
      let scope = 'user-read-private user-read-email user-modify-playback-state';


      let args = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope: scope,
        redirect_uri: redirectUri,
        state: state,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge
      });

      window.location = 'https://accounts.spotify.com/authorize?' + args;
    });
}

// get the access token that we need to make requests to the spotify api endpoints
function getToken(clientId, redirectUri, code) {
  if (!(clientId && redirectUri && code)) {
    console.error('requires', clientId, redirectUri, code)
  }
  let codeVerifier = localStorage.getItem('code_verifier');

  let body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier
  });

  return fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('HTTP status ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      localStorage.setItem('access_token', data.access_token);
      return data.access_token;
    })
    .catch(error => {
      console.error('Error:', error);
    });
}


////////// functions to use the Spotify API
// function to use the profile endpoint
function getProfile(accessToken) {
  return fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  }).then(r => r.json()).then(data => {
    console.log(data)
    return data;
  })
}

// function to search for spotify results
function searchSpotify(accessToken, query) {
  return fetch(`https://api.spotify.com/v1/search?q=${query}&type=album%2Cplaylist%2Cartist%2Ctrack`, {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  }).then(r => r.json()).then(data => {
    console.log(data)
    console.log("Names", data.artists.items)
    artistArray = data.artists.items;
    artistName = data.artists.items[0].name;
    console.log(artistName);
    url = `https://api.api-ninjas.com/v1/celebrity?name=${artistName}`
    console.log("THE CORRECT", url)

    console.log("URL:", url);
    xhr.open('GET', url, true);
    xhr.setRequestHeader('X-Api-Key', apiKey);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();


    return data.artists.items[0].name;
  })
  
}



xhr.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    console.log("IT WORKED");
    console.log(xhr.responseText);
    appendCeleb(xhr.responseText)
  } else if (this.readyState == 4 && this.status != 200) {
    console.error('Error: ', xhr.responseText);
  }
};