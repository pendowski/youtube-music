function run() {
    const element = document.querySelector('ytmusic-popup-container')
    const mutation = new MutationObserver(() => {
        const popup = element.querySelector('paper-dialog')
        if (popup && popup.innerHTML.indexOf('Continue watching?') !== -1) {
            popup.querySelector('yt-button-renderer').click()
        }
    })
    mutation.observe(element, { childList: true, subtree: true })
}

module.exports = run