<template>
  <div class="spotify-player">
    <div v-if="existCurrentTrack">
      <dl class="dl-horizontal">
        <dt>
          <i v-if="favorite" class="bi-heart-fill text-success"></i>
          Song name
        </dt>
        <dd class="text-overflow text-info">
          <span class="display-4">{{songName}}</span>
        </dd>

        <dt>Artist name</dt>
        <dd class="text-overflow display-4 text-primary">{{artistName}}</dd>

        <dt v-if="formattedProgress != null">Song progress</dt>
        <dd v-if="formattedProgress != null" class="text-overflow">{{formattedProgress}} ({{formattedDuration}})</dd>

        <dt>Playlist name</dt>
        <dd class="text-overflow">{{playlistName}}</dd>

      </dl>
      <button v-on:click="play" class="btn btn-link">Play</button>
      <button v-on:click="pause" class="btn btn-link">Pause</button>
    </div>
  </div>
  <div v-if="existPlaylist && !existCurrentTrack">
    <dl class="dl-horizontal">
      <dt>Playlist name</dt>
      <dd class="text-overflow">{{playlistName}}</dd>
    </dl>
    <button v-on:click="playLastPlaylist" class="btn btn-link">Play last playlist</button>
  </div>
  <div v-if="!existCurrentTrack && !existPlaylist">
    not track and playlist
  </div>
</template>
<script>
import SpotifyRequest from "@/utils/SpotifyRequest";
import moment from "moment";

export default {
  name: 'SpotifyPlayer',
  data() {
    return {
      existPlaylist: false,
      existCurrentTrack: false,
      favorite: false,
      countTimer: null,
      progressMs: null,
      leftMs: null,
      progress_ms: null,
      artistName: null,
      songName: null,
      playlistName: null,
      playlistUri: null,
      formattedDuration: null,
      formattedProgress: null,
      primaryDeviceId: null
    }
  },
  mounted() {
    this.fetchPlayer();
  },
  methods: {
    play: function () {
      this.resetTimer();
      SpotifyRequest.put('/v1/me/player/play').then(response => {
        console.log(response);
        this.fetchPlayer();
      })
    },
    pause: function () {
      this.resetTimer();
      SpotifyRequest.put('/v1/me/player/pause').then(response => {
        console.log(response);
      })
    },
    playLastPlaylist: function() {
      this.decideMainDevice().then(deviceId => {
        console.log(deviceId);
        SpotifyRequest.put(`/v1/me/player/play?device_id=${deviceId}`, {
          'context_uri': this.playlistUri
        }).then(response => {
          console.log(response);
          this.fetchPlayer();
        })

      })
    },
    decideMainDevice: function() {
      return SpotifyRequest.get('/v1/me/player/devices').then(response => {
        console.log(response);
        const data = response.data;
        const primaryDevice = data.devices.find(el => el.type === 'Speaker');
        console.log(primaryDevice);
        this.primaryDeviceId = primaryDevice.id;
        return primaryDevice.id;
      })
    },
    fetchPlayer: function () {
      SpotifyRequest.get('/v1/me/player').then(response => {
        const data = response.data;
        console.log(response);

        if (data.item != null) {
          this.progress_ms = data.progress_ms;
          this.artistName = data.item.artists[0].name;
          this.songName = data.item.name;

          this.formattedDuration = moment.utc(data.item.duration_ms).format('m:ss');
          this.formattedProgress = moment.utc(data.progress_ms).format('m:ss');
          this.progressMs = data.progress_ms;
          this.leftMs = data.item.duration_ms - data.progress_ms;
          this.existCurrentTrack = true;

          let self = this;
          if (data.is_playing) {
            this.countTimer = setTimeout(
                function () {
                  self.count();
                }, self.leftMs % 1000
            )
          }

          if (data.context != null) {
            let playlistId = data.context.uri.match(/:([^:]*)$/)[1];
            this.fetchPlaylist(playlistId);
          }

          const trackId = data.item.id;
          this.fetchTrack(trackId);
        } else {
          // empty
          this.fetchRecentlyPlayed();
        }

      })
    },
    fetchRecentlyPlayed: function () {
      SpotifyRequest.get('/v1/me/player/recently-played', {
        'limit': 1
      }).then(response => {
        console.log(response);
        const data = response.data;
        const item = data.items[0];
//        const track = item.track;

//        this.artistName = track.artists[0].name;
//        this.songName = track.name;
//        this.existCurrentTrack = true;

        if (item.context != null) {
          let playlistId = item.context.uri.match(/:([^:]*)$/)[1];
          this.fetchPlaylist(playlistId);
        }

      })
    },
    fetchTrack: function (trackId) {
      SpotifyRequest.get('/v1/me/tracks/contains', {
        'ids': trackId
      }).then(response => {
        const data = response.data;
        console.log(data);
        this.favorite = data[0];
      });
    },
    fetchPlaylist: function (playlistId) {

      SpotifyRequest.get(`/v1/playlists/${playlistId}`).then(response => {
        const data = response.data;
        console.log(data);
        this.playlistName = data.name;
        this.playlistUri = data.uri;
        this.existPlaylist = true;
      })
    },
    count: function () {
      let self = this;
      if (this.leftMs < 1000) {
        // empty
      } else {
        this.progressMs += 1000;
        this.leftMs -= 1000;
        this.formattedProgress = moment.utc(this.progressMs).format('m:ss');
        this.countTimer = setTimeout(
            function () {
              self.count();
            }, 1000
        )
      }
    },
    resetTimer: function() {
      if (this.countTimer) {
        clearInterval(this.countTimer);
        this.countTimer = null;
      }
    }
  }

}
</script>
