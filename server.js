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
    const requestPath = req.url === '/' ? '/index.html' : req.url;
    const filePath = path.join(base, requestPath);
    const publicPath = path.join(base, 'public', requestPath);

    const serveFile = (targetPath) => {
      const ext = path.extname(targetPath) || '.html';
      fs.readFile(targetPath, (err, data) => {
        if (err) return false;
        res.writeHead(200, {'Content-Type': mime[ext] || 'application/octet-stream'});
        res.end(data);
      });
      return true;
    };

    fs.access(filePath, fs.constants.R_OK, (err) => {
      if (!err) return serveFile(filePath);
      fs.access(publicPath, fs.constants.R_OK, (err2) => {
        if (!err2) return serveFile(publicPath);
        res.writeHead(404, {'Content-Type':'text/plain'});
        res.end('Not found');
      });
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
