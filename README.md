# electron-ipc-webview-stream

Duplex stream for communication between `<webview>` element and its hosting renderer process on Electron. Unlike `<iframe>`, the embeded `<webview>` runs on the separate renderer process and the all interactions between them are done asynchronously to keep the Electron app safe.


## Install
For npm,

```
npm i electron-ipc-webview-stream --save
```

For yarn,

```
yarn add electron-ipc-webview-stream
```

## Use
#### In the embeded webiview, use `GuestIPCStream`
```
const GuestIPCStream = require('electron-ipc-webview-stream').GuestIPCStream

...
cosnt ipcStream = GuestIPCStream('domain-specific-unique-channel-name')

ipcStream.on('data', (data) => {
  console.log(data)
})

ipcStream.write('ping')
```

#### In the hosting app, use `HostIPCStream`
```
const HostIPCStream = require('electron-ipc-webview-stream').HostIPCStream

...
const webView = getWebView() // returns a reference to the <webview> element
cosnt ipcStream = HostIPCStream('domain-specific-unique-channel-name', webview)

ipcStream.on('data', (data) => {
  console.log(data)
  ipcStream.write('pong')
})
```

## License

MIT Copyright
