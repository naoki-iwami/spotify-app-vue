<template>
  <div class="spotify-player">
    <div v-if="existCurrentTrack">
      <dl class="dl-horizontal">
        <dt>
          <i v-if="favorite" class="bi-heart-fill text-success"></i>
          Song name
        </dt>
        <dd class="text-overflow text-info">
          <span class="display-2">{{songName}}</span>
        </dd>

        <dt>Artist name</dt>
        <dd class="text-overflow display-4 text-primary">{{artistName}}</dd>

        <dt v-if="formattedProgress != null">
          Song progress
          <i v-if="currentDeviceType === 'Speaker'" class="bi-speaker text-secondary"></i>
        </dt>
        <dd v-if="formattedProgress != null" class="text-overflow">
          <i v-if="currentPlayerIsPlaying === false" class="bi-pause text-secondary"></i>
          <i v-if="currentPlayerIsPlaying === true" class="bi-play-circle-fill text-secondary"></i>
          {{formattedProgress}} ({{formattedDuration}})
        </dd>

        <dt>
          {{contextType}} name
        </dt>
        <dd class="text-overflow">{{contextName}}</dd>

      </dl>

      <div v-if="currentDeviceVolume != null">Volume:
        {{currentDeviceVolume}}
      </div>

      <button v-if="currentPlayerIsPlaying === false" v-on:click="play" class="btn btn-link">Play</button>
      <button v-if="currentPlayerIsPlaying === true" v-on:click="pause" class="btn btn-link">Pause</button>
    </div>
  </div>
  <div v-if="contextName && !existCurrentTrack">
    <dl class="dl-horizontal">
      <dt>{{contextType}} name</dt>
      <dd class="text-overflow">{{contextName}}</dd>
    </dl>
    <button v-on:click="playLastContext" class="btn btn-link">Play last context</button>
  </div>
  <div v-if="!existCurrentTrack && !contextName">
    not track and playlist
  </div>
  <div>
    <button v-on:click="reload" class="btn btn-link">Reload</button>
  </div>
  <div>
    <button v-on:click="fullscreen" class="btn btn-link">Fullscreen</button>
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
      existArtist: false,
      existCurrentTrack: false,
      currentPlayerIsPlaying: false,
      currentDeviceType: null,
      currentDeviceId: null,
      currentDeviceVolume: null,
      favorite: false,
      countTimer: null,
      progressMs: null,
      leftMs: null,
      progress_ms: null,
      artistName: null,
      songName: null,
      contextType: null,
      contextName: null,
      contextUri: null,
      formattedDuration: null,
      formattedProgress: null,
      primaryDeviceId: null
    }
  },
  mounted() {
    // まずは現在のプレーヤーで再生されている情報を取得
    console.log("mopunted -> fetchPlayer");
    this.fetchPlayer();
  },
  methods: {
    reload: function () {
      console.log("reload -> fetchPlayer");
      this.fetchPlayer();
    },
    fullscreen: function() {
      // document.body.requestFullscreen();
      document.documentElement.requestFullscreen();
    },
    play: function () {
      this.resetTimer();
      let url = '/v1/me/player/play'
      if (this.primaryDeviceId != null) url += `?device_id=${this.primaryDeviceId}`
      SpotifyRequest.put(url).then(response => {
        console.log(response);
        console.log("play -> fetchPlayer");
        this.fetchPlayer();
      }).catch(error => {
        // 現在アクティブなデバイスが見つからない場合など
        console.log(error.response.status); // ex. 404
      })
    },
    pause: function () {
      this.resetTimer();
      this.currentPlayerIsPlaying = false;
      SpotifyRequest.put('/v1/me/player/pause').then(response => {
        console.log(response);
      })
    },
    playWithPrimaryDevice: function() {
      this.decideMainDevice().then(deviceId => {
        SpotifyRequest.put(`/v1/me/player/play?device_id=${deviceId}`).then(response => {
          console.log(response);
          console.log("playWithPrimaryDevice -> fetchPlayer");
          this.fetchPlayer();
        })
      })
    },
    playLastContext: function() {
      this.decideMainDevice().then(deviceId => {
        console.log(deviceId);
        SpotifyRequest.put(`/v1/me/player/play?device_id=${deviceId}`, {
          'context_uri': this.contextUri
        }).then(response => {
          console.log(response);
          console.log("playLastContext -> fetchPlayer");
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

        if (data.device != null) {
          this.currentDeviceType = data.device.type;
          this.currentDeviceId = data.device.id;
          this.currentDeviceVolume = data.device.volume_percent;
        }

        if (data.item != null) {
          // 現在再生されている曲がある場合
          this.progress_ms = data.progress_ms;
          this.artistName = data.item.artists[0].name;
          this.songName = data.item.name;

          this.formattedDuration = moment.utc(data.item.duration_ms).format('m:ss');
          this.formattedProgress = moment.utc(data.progress_ms).format('m:ss');
          this.progressMs = data.progress_ms;
          this.leftMs = data.item.duration_ms - data.progress_ms;
          this.existCurrentTrack = true;

          let self = this;
          this.currentPlayerIsPlaying = data.is_playing;
          if (data.is_playing) {
            this.resetTimer();
            this.countTimer = setTimeout(
                function () {
                  self.count();
                }, self.leftMs % 1000
            )
          }

          if (data.context != null) {
            // let contextUri = data.context.uri.match(/:([^:]*)$/)[1];
            if (data.context.type === 'playlist') {
              let playlistId = data.context.uri.match(/:([^:]*)$/)[1];
              console.log('fetchPlayer -> fetchPlaylist');
              this.fetchPlaylist(playlistId);
            }
            if (data.context.type === 'artist') {
              let artistId = data.context.uri.match(/:([^:]*)$/)[1];
              this.fetchArtist(artistId);
            }
            if (data.context.type === 'album') {
              let albumId = data.context.uri.match(/:([^:]*)$/)[1];
              this.fetchAlbum(albumId);
            }
          }

          const trackId = data.item.id;
          this.fetchTrack(trackId);
        } else {
          // 現在再生されている曲がない場合、プライマリデバイス上にプレイバックを復帰させる
          this.fetchPlayerWithPrimaryDevice();
        }

      }).catch(error => {
        if (error.response.status === 401) {
          this.refreshToken();
        }
      })
    },
    refreshToken: function() {
      console.log('refreshToken');
      SpotifyRequest.post('/api/token', new URLSearchParams({
        'grant_type': 'refresh_token',
        'refresh_token': localStorage.refreshToken
      })).then(response => {
        console.log(response);
        const accessToken = response.data.access_token;
        localStorage.accessToken = accessToken;
      });
    },
    fetchPlayerWithPrimaryDevice: function() {
      // プライマリデバイスを取得して、そこにプレイバックを移す。
      // これによって Player が最後に再生されていた状態で戻る
      this.decideMainDevice().then(deviceId => {
        console.log(deviceId);
        SpotifyRequest.put('/v1/me/player', {
          'device_ids': [ deviceId ]
        }).then(response => {
          console.log(response);
          console.log("fetchPlayerWithPrimaryDevice -> fetchPlayer");
          this.fetchPlayer();
        }).catch(error => {
          // console.log(error);
          console.log(error.response.status); // ex. 400
          this.fetchRecentlyPlayed();
        })
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
      console.log('fetchPlaylist');
      SpotifyRequest.get(`/v1/playlists/${playlistId}`).then(response => {
        const data = response.data;
        console.log('RESPONSE `/v1/playlists/${playlistId}`');
        console.log(data);
        this.contextName = data.name;
        this.contextUri = data.uri;
        this.contextType = 'playlist';
      })
    },
    fetchArtist: function (artistId) {
      console.log('fetchArtist');
      SpotifyRequest.get(`/v1/artists/${artistId}`).then(response => {
        const data = response.data;
        console.log('RESPONSE `/v1/artists/${artistId}`');
        console.log(data);
        this.contextName = data.name;
        this.contextUri = data.uri;
        this.contextType = 'artist';
      })
    },
    fetchAlbum: function (albumId) {
      console.log('fetchAlbum');
      SpotifyRequest.get(`/v1/albums/${albumId}`).then(response => {
        const data = response.data;
        console.log('RESPONSE `/v1/albums/${albumId}`');
        console.log(data);
        this.contextName = data.name;
        this.contextUri = data.uri;
        this.contextType = 'album';
      })
    },
    count: function () {
      let self = this;
      if (this.leftMs == null) {
        // nothing
      } else if (this.leftMs < 1000) {
        console.log(`count -> fetchPlayer leftMs = ${this.leftMs}`);
        this.leftMs = null;
        setTimeout(
            function () {
              self.fetchPlayer();
            }, 1000
        )
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
