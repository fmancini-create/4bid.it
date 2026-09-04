function mountAnna4Bid() {
  if (document.querySelector('script[data-anna-4bid="4bid"]')) return
  const script = document.createElement("script")
  script.src = "https://hotelaccelerator.com/anna-chat.js"
  script.defer = true
  script.dataset.anna4bid = "4bid"
  script.dataset.publicKey = "wk_6467516bed164ec58ff5d8d1e776e5d6cac1"
  script.dataset.product = "4BID"
  script.dataset.hideOn = "/admin,/super-admin,/ecomobility"
  document.body.appendChild(script)
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountAnna4Bid, { once: true })
else mountAnna4Bid()
