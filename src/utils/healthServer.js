// Render's Web Service health check needs an open port; the bot itself only
// holds a Discord gateway connection, so this just answers 200 on GET /.
const http = require("node:http");
const { logger } = require("./logger");

function startHealthServer(port = process.env.PORT || 3000) {
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
  });

  server.listen(port, () => {
    logger.info(`Health check server listening on port ${port}.`);
  });

  return server;
}

module.exports = { startHealthServer };
