<template>
  <div class="app-spotify-login">
    <button v-on:click="loginSpotify">Login Spotify</button>
  </div>
</template>

<script>
import queryString from 'query-string';
import cryptoRandomString from 'crypto-random-string';
import SpotifySecret from "@/defines/SpotifySecret.js";

const generateRandomString = function (length) {
  return cryptoRandomString({ length: length })
}

export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  methods: {
    loginSpotify: function () {
      console.log('login');
      const redirect_uri = location.origin + '/callback'; // Your redirect uri

      const state = generateRandomString(16);
      const scope = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-recently-played';

      const s = queryString.stringify({
        response_type: 'code',
        client_id: SpotifySecret.clientId,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
      });
      console.log(s);
      window.location.href = 'https://accounts.spotify.com/authorize?' + s;

    }
  }
}
</script>
