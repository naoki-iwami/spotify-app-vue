import axios from "axios";
import queryString from 'query-string';

export default class SpotifyRequest {

    static get(url, data = {}) {
        console.log(url)
        const s = queryString.stringify(data);

        return axios.get(
            'https://api.spotify.com' + url + '?' + s,
            {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.accessToken
                }
            }
        )
    }

    static put(url, data = {}) {
        console.log(url)
        return axios.put(
            'https://api.spotify.com' + url,
            data,
            {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.accessToken
                }
            }
        )
    }

    static post(url, data = {}) {
        console.log(url)
        return axios.post(
            'https://api.spotify.com' + url,
            data,
            {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.accessToken
                }
            }
        )
    }

}
