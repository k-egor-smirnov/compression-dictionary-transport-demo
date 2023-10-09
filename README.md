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
- Run `bun start` and open `https://localhost`
