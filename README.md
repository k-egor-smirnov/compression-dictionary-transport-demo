# Compression dictionary transport demo

This demo showing the process of encoding static files with dictionaries and the new [Compression dictionary transport](https://github.com/WICG/compression-dictionary-transport).

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
- Add new entry to `/etc/hosts` with custom domain pointing to localhost e.g. `127.0.0.1 test.local`
- Run `bun start` and open `https://test.local` (your custom domain here)

# Making sure the cache is working

- Open [chrome://net-internals/#sharedDictionary](chrome://net-internals/#sharedDictionary). If you can see your website here then it's working
- Open the Network tab in Chrome DevTools. Then open `/v1.html` and navigate to `/v2.html`. It's working if you see approximately 20kb in the size column for the JS file

# How it's working

0. When you start this demo, it generates a dictionary with `zstd --train`. A dictionary contains the most used strings in your project to improve encoding.
1. Page loads with Link header containing dictionary URL from previous step.
2. Browser starts downloading dictionary after idle. The server will send it content and also header `use-as-dictionary: match="/js/*"` that means it should be used as dictionary for all next files matching pattern `/js/*`
3. When you request new files matching pattern `/js/*`, the browser sends `sec-available-dictionary` header with SHA256 content hash of the dictionary file.
4. Server will try to find a dictionary with that hash. If it's found, it will compress the requested file with it. If a dictionary is not found, it may encode the requested file with any algorithm.

## Delta compression
When you can identify the previous file version path, you can compress the new version with it. <br />
Users will receive only diff of the two files, and it's a great opportunity to dramatically decrease traffic size between deploys.
The scheme is very similar to the previous, and they should not conflict because browser will use a more specific dictionary.
1. Server has to send `use-as-dictionary: match="/js/[some-pattern]*"` where `[some-pattern]` is a pattern that can be used to identify unique files. E.g. this demo uses pattern `/js/id-${fileStableID}*"`.
2. Browser will store SHA256 hash of the received file.
3. When you request next version of file, browser sends `sec-available-dictionary` with previous hash.
4. Server will try to find previous file with that hash. If it's found, it will compress new file with it. If a dictionary is not found, it may encode requested file with any algorithm.
