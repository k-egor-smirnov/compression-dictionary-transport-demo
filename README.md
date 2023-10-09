# Compression dictionary transport demo

In this demo showed process of delta encoding static files with zstd and the new Compression dictionary transport

# Requirements

- Bun (>= v1.0)
- zstd
- Chrome Canary (>= v118)

# Getting started

- Enable flags:
  - [chrome://flags#enable-compression-dictionary-transport](chrome://flags/#enable-compression-dictionary-transport)
  - [chrome://flags#enable-compression-dictionary-transport-backend](chrome://flags/#enable-compression-dictionary-transport-backend)
  - [chrome://flags/#enable-zstd-content-encoding](chrome://flags/#enable-zstd-content-encoding)
  - [chrome://flags/#enable-shared-zstd](chrome://flags/#enable-shared-zstd)
- Add new entry to `/etc/hosts` with custom domain pointing to localhost e.g `127.0.0.1 test.local`
- Run `bun start` and open `https://test.local` (your custom domain here)


# Making sure cache is working
- Open [chrome://net-internals/#sharedDictionary](chrome://net-internals/#sharedDictionary). If you can see your website here then it's working
- Open Network tab in Chrome DevTools. Then open `/v1.html` and navigate to `/v2.html`. It's working if you see approximately 20kb in size column for JS file
