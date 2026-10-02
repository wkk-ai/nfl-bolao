import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "out");
const prefix = "/nfl-bolao";
const host = "0.0.0.0";
const port = Number(process.env.PORT || 43147);

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

function send(res, code, body) {
  res.writeHead(code, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(body);
}

function underOut(rel) {
  const file = path.normalize(path.join(out, rel));
  if (!file.startsWith(out)) return null;
  return file;
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  if (url === "/" || url === "") {
    res.writeHead(302, { Location: `${prefix}/` });
    res.end();
    return;
  }
  if (!url.startsWith(prefix)) {
    send(res, 404, "Not found");
    return;
  }
  const rel = url.slice(prefix.length) || "/";
  const base = underOut(rel);
  if (!base) {
    send(res, 403, "Forbidden");
    return;
  }
  const candidates = rel.endsWith("/")
    ? [path.join(base, "index.html")]
    : [base, `${base}.html`, path.join(base, "index.html")];
  const file = candidates.find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
  if (!file) {
    const fallback = path.join(out, "404.html");
    if (fs.existsSync(fallback)) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      fs.createReadStream(fallback).pipe(res);
      return;
    }
    send(res, 404, "Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

server.listen(port, host, () => {
  console.log(`Bolão static site http://127.0.0.1:${port}${prefix}/`);
});
