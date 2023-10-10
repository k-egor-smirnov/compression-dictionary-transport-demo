import { execSync } from "child_process";

const hashesByFile: Record<string, string> = {};
const filesByHash: Record<string, string> = {};

async function touchFileHash(path: string, file: import("bun").BunFile) {
  if (hashesByFile[path]) {
    return;
  }

  const buf = await file.arrayBuffer();

  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(buf);
  hashesByFile[path] = hasher.digest("hex");
  filesByHash[hashesByFile[path]] = path;

  console.log("new file hash %s: %s", path, hashesByFile[path]);
}

function serveHTML(req: Request) {
  const url = new URL(req.url);
  const file = url.pathname === "/" ? "index.html" : url.pathname;
  return new Response(Bun.file("./static/" + file), {
    headers: {
      Link: '</dict.dat>; rel="dictionary";',
    },
  });
}

function serveJS(req: Request) {
  const url = new URL(req.url);
  const { pathname } = url;

  const file = Bun.file("./static" + pathname);
  const serverPath = "./static" + pathname;

  // Saving file hash to cache. Could be preloaded on server start
  touchFileHash(serverPath, file);

  // Unique id that keeps between different file builds
  const fileStableID = /id-(.+?)[\.]/.exec(pathname)?.[1];

  const dictionaryHash = req.headers.get("sec-available-dictionary");
  const dictionaryContentServerPath = filesByHash[dictionaryHash];

  let buf: Buffer;
  let isDictionaryUsed = false;

  if (
    dictionaryContentServerPath &&
    dictionaryContentServerPath !== serverPath
  ) {
    console.log(
      "using dictionary %s to compress %s",
      serverPath,
      dictionaryContentServerPath
    );

    buf = execSync(
      `zstd -c ${serverPath} --patch-from ${dictionaryContentServerPath} -10`
    );

    isDictionaryUsed = true;
  } else {
    buf = execSync(`zstd -c ${serverPath} -10`);
  }

  const headers: HeadersInit = {
    "Content-Encoding": isDictionaryUsed ? "zstd-d" : "zstd",
    "Content-Type": "text/javascript",
    "Vary": "sec-available-dictionary",
  };

  if (fileStableID) {
    headers["use-as-dictionary"] = `match="/js/id-${fileStableID}*"`;
  }

  return new Response(buf, {
    headers,
  });
}

async function prehashFiles() {
  const path = "./static/dict.dat";
  await touchFileHash(path, Bun.file(path));
}

console.log("Prehashing files");
await prehashFiles();

console.log("Starting server");

Bun.serve({
  fetch(req) {
    const url = new URL(req.url);
    console.log("[%s] %s", req.method, url.pathname + url.search);

    if (url.pathname.endsWith(".html") || url.pathname === "/") {
      return serveHTML(req);
    }

    if (url.pathname.startsWith("/js")) {
      return serveJS(req);
    }

    if (url.pathname.endsWith(".dat")) {
      const serverPath = "./static" + url.pathname;
      const file = Bun.file("./static" + url.pathname);
      touchFileHash(serverPath, file);

      return new Response(file, {
        headers: {
          "use-as-dictionary": 'match="/js/*"',
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
