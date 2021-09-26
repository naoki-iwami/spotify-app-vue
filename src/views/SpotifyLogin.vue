<template>
  <div class="spotify">
    <h1>This is an spotify page</h1>
    <button v-on:click="loginSpotify">Login Spotify</button>
  </div>
</template>

<script>
import queryString from 'query-string';
import cryptoRandomString from 'crypto-random-string';
import SpotifySecret from "@/defines/SpotifySecret.js";

const stateKey = 'spotify_auth_state';

const generateRandomString = function (length) {
  return cryptoRandomString({ length: length })
}

export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  created() {
    console.log('created')
  },
  methods: {
    loginSpotify: function () {
      console.log('login');
      const redirect_uri = location.origin + '/callback'; // Your redirect uri

      const state = generateRandomString(16);
      this.$cookie.set(stateKey, state);
      // user-modify-playback-state
      const scope = [
        'user-library-read',
        'user-modify-playback-state',
        'user-read-email',
        'user-read-playback-state',
        'user-read-private',
        'user-read-recently-played',
      ].join(' ');

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
