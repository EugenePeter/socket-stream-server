const express = require("express");
const http = require("http");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);
require("./sockets")(io);

app.use(express.static(path.join("../uploads/")));

server.listen(process.env.PORT, () =>
  console.log(`Server started at port: ${process.env.PORT}`)
);
