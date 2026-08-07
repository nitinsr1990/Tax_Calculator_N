const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const base = process.cwd();

const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json'
};

function createServer(){
  return http.createServer((req, res) => {
    const filePath = path.join(base, req.url === '/' ? '/index.html' : req.url);
    const ext = path.extname(filePath) || '.html';
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, {'Content-Type':'text/plain'});
        return res.end('Not found');
      }
      res.writeHead(200, {'Content-Type': mime[ext] || 'application/octet-stream'});
      res.end(data);
    });
  });
}

function listen(portToTry){
  const server = createServer();
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = Number(portToTry) + 1;
      console.warn(`Port ${portToTry} in use, trying ${nextPort}...`);
      listen(nextPort);
    } else {
      console.error(err);
      process.exit(1);
    }
  });
  server.listen(portToTry, () => {
    console.log(`Server running at http://localhost:${portToTry}`);
  });
}

listen(port);
