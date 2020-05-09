function findCurrentPlaying() {
    const infoElement = document.querySelector('.content-info-wrapper.style-scope.ytmusic-player-bar')
    const pauseElement = document.querySelector('#play-pause-button')
    if (!infoElement || !pauseElement) {
        return null
    }
    const title = infoElement.querySelector('.title')
    const subtitle = infoElement.querySelector('.subtitle .byline')
    let result = {
        title: '',
        artist: '',
        isPlaying: false
    }

    if (title) {
        result.title = title.innerText
    }
    if (subtitle) {
        result.artist = subtitle.innerText
    }
    if (pauseElement.getAttribute('aria-label') === 'Pause') {
        result.isPlaying = true
    }
    return JSON.stringify(result)
}

function run() {
    const WebSocket = require("ws")
    const wss = new WebSocket.Server({ port: 6001 })
    wss.on('connection', function (w) {
        let gotMessage = false
        w.on('message', function (data) {
            if (data != '') {
                w.send(findCurrentPlaying())
                if (!gotMessage) {
                    console.log("Currenty-Playing:", data)
                }
            }
        })
        w.on('close', function () {
            console.log("Currenty-Playing: Closed")
        })
        w.send(findCurrentPlaying())
    })
}

module.exports = run