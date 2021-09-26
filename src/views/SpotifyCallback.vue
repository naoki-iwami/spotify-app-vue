<template>
  <div class="callback">
    <h1>This is an callback page</h1>
  </div>
</template>

<script>
import axios from "axios";
import router from "../router";
import SpotifySecret from "@/defines/SpotifySecret.js";

const stateKey = 'spotify_auth_state';

export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  created() {
    console.log('callback created')
    const code = this.$route.query.code || null;
    const state = this.$route.query.state || null;
    const storedState = this.$cookie.get(stateKey) || null;
    console.log(code);
    if (state === null || state !== storedState) {
      this.$router.push('/spotify');
    } else {
      console.log('ok');
      this.$cookie.remove(stateKey);

      const redirect_uri = location.origin + '/callback'; // Your redirect uri

      const formData = new URLSearchParams({
        'code': code,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code'
      })
      axios.post(
          'https://accounts.spotify.com/api/token',
          formData,
          {
            headers: {
              'Authorization': 'Basic ' + (new Buffer(SpotifySecret.clientId + ':' + SpotifySecret.clientSecret).toString('base64'))
            }
          }
      ).then(response => {
        console.log(response);
        const accessToken = response.data.access_token;
        //const refreshToken = response.data.refresh_token;
        localStorage.accessToken = accessToken;
        router.push('/spotify-start');

/*
        axios.get(
            'https://api.spotify.com/v1/me',
            {
              headers: {
                'Authorization': 'Bearer ' + accessToken
              }
            }
        ).then(response => {
          console.log(response);
        })
*/

      })


    }
  }
}
</script>
