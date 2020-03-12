const mutations = [];
function run() {
    console.log('Continue listening loaded!')

    const element = document.querySelector('ytmusic-popup-container')
    const handler = () => {
        console.log('Element changed', element, element.querySelector('paper-dialog'))

        const popup = element.querySelector('paper-dialog')
        installInPopup()
        if (popup && popup.innerHTML.indexOf('Continue watching?') !== -1 && popup.style.display != 'none') {
            popup.querySelector('yt-button-renderer').click()
        }
    }
    const installInPopup = () => {
        let dialog = element.querySelector('paper-dialog')
        const key = 'mutation-installed'
        if (dialog && dialog.getAttribute(key) != '1') {
            mutation = new MutationObserver(handler)
            mutation.observe(element, { childList: true, subtree: true, attributes: true })
            mutations.push(mutation)
            dialog.setAttribute(key, '1')
        }
    }

    let mutation = new MutationObserver(handler)
    mutation.observe(element, { childList: true, subtree: true })
    mutations.push(mutation)

    installInPopup()
}

module.exports = run