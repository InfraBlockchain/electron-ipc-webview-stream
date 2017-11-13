const bufferJson = require('buffer-json')
const Duplex = require('stream').Duplex
const ipcRenderer = require('electron').ipcRenderer
const isRenderer = require('is-electron-renderer')
const util = require('util')

function GuestIPCStream(channel, streamOpts) {
  
  if (!isRenderer) {
    throw 'Should be called on renderer process!'
  }

  if (!(this instanceof GuestIPCStream)) {
    return new GuestIPCStream(channel, streamOpts)
  }

  streamOpts = streamOpts || {}
  streamOpts.objectMode = streamOpts.objectMode ? streamOpts.objectMode : true
  
  this.channel = channel

  const ipcCallback = (event, data) => {
    if (typeof data === 'string') {
      data = JSON.parse(data, bufferJson.reviver)
    }
    this.push(data)
  }

  ipcRenderer.on(this.channel, ipcCallback)

  this.on('finish', () => {
    ipcRenderer.sendToHost(this.channel + '-finish');
    ipcRenderer.removeListenner(this.channel, ipcCallback)
  })

  ipcRenderer.once(channel + '-finish', () => this.push(null))

  Duplex.call(this, streamOpts)
}
util.inherits(GuestIPCStream, Duplex)

// noop
GuestIPCStream.prototype._read = function() {}

GuestIPCStream.prototype._write = function(data, encoding, cb) {
  if (typeof data === 'string') {
    data = JSON.stringify(data)
  }

  if (Buffer.isBuffer(data)) {
    data = JSON.stringify(data, null, bufferJson.replacer)
  }

  ipcRenderer.sendToHost(this.channel, data)
  cb()
}

module.exports.GuestIPCStream = GuestIPCStream

function HostIPCStream(channel, webview, streamOpts) {

  if (!isRenderer) {
    throw 'Should be called on renderer process!'
  }
  
  if (!(this instanceof HostIPCStream)) {
    return new HostIPCStream(channel, webview, streamOpts)
  }

  streamOpts = streamOpts || {}
  streamOpts.objectMode = streamOpts.objectMode ? streamOpts.objectMode : true

  this.webview = webview;
  this.channel = channel

  const ipcCallback = (event) => {
    if (this.channel === event.channel) {
      this.push(JSON.parse(event.args, bufferJson.receiver))
    }
  }

  this.webview.addEventListener('ipc-message', ipcCallback)
  
  this.on('finish', () => {
    this.webview.send(this.channel + '-finish')
    this.webview.removeListener(this.channel, ipcCallback)
  })
  this.webview.addEventListener(this.channel + '-finish', () => this.push(null), { once: true })

  Duplex.call(this, streamOpts)
}
util.inherits(HostIPCStream, Duplex)

// noop
HostIPCStream.prototype._read = function() {}

HostIPCStream.prototype._write = function(data, encoding, cb) {

  if (typeof data === 'string') {
    data = JSON.stringify(data)
  }

  if (Buffer.isBuffer(data)) {
    data = JSON.stringify(data, null, bufferJson.replacer)
  }

  this.webview.send(this.channel, data)
  cb()
}

module.exports.HostIPCStream = HostIPCStream