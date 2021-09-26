<template>
  <div class="spotify-me">
    <h1>{{ display_name }}</h1>
  </div>
</template>
<script>
import SpotifyRequest from "@/utils/SpotifyRequest";

export default {
  name: 'SpotifyMe',
  props: {
//    display_name: String
  },
  data() {
    return {
      display_name: null
    }
  },
  mounted() {
    SpotifyRequest.get('/v1/me').then(response => {
      console.log(response);
      this.display_name = response.data.display_name;
    })
  }
}
</script>
