import { execSync } from "child_process";

const hashesByFile: Record<string, string> = {};
const filesByHash: Record<string, string> = {};

async function touchFileHash(path: string, file: import("bun").BunFile) {
  if (hashesByFile[path]) {
    return;
  }

  const text = await file.text();

  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(text);
  hashesByFile[path] = hasher.digest("hex");
  filesByHash[hashesByFile[path]] = path;

  console.log("new file hash %s: %s", path, hashesByFile[path]);
}

Bun.serve({
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname.endsWith(".html") || url.pathname === "/") {
      const file = url.pathname === "/" ? "index.html" : url.pathname;
      return new Response(Bun.file("./" + file));
    }

    if (url.pathname.startsWith("/js")) {
      const file = Bun.file("./" + url.pathname);

      // Saving file hash to cache. Could be preloaded on server start
      touchFileHash(url.pathname, file);

      const prevFileHash = req.headers.get("sec-available-dictionary");
      const prevFilePath = filesByHash[prevFileHash];

      let buf: Buffer;
      let isPreviousFileUsed = false;

      if (prevFilePath && prevFilePath !== url.pathname) {
        console.log(
          "using previous file %s to compress %s",
          url.pathname,
          prevFilePath
        );

        buf = execSync(
          `zstd -c .${url.pathname} --patch-from .${prevFilePath}`
        );

        isPreviousFileUsed = true;
      } else {
        buf = execSync(`zstd -c ./${url.pathname}`);
      }

      return new Response(buf, {
        headers: {
          "use-as-dictionary": 'match="/js/*"',
          "Content-Encoding": isPreviousFileUsed ? "zstd-d" : "zstd",
          "Content-Type": "text/javascript",
          "Vary": "sec-available-dictionary",
        },
      });
    }
  },
  tls: {
    cert: Bun.file("./cert.pem"),
    key: Bun.file("./key.pem"),
    passphrase: "1234",
  },
  port: 443,
});
