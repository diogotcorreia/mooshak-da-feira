const path = require('path');
const spawn = require('child_process').spawn;
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuid } = require('uuid');
const { enqueue, unqueue, getQueueSize } = require('./queue');
const fs = require('fs').promises;

const mooshakDaFeira = ({ tests = [], port = process.env.PORT || 5000 } = {}) => {
  const app = express();
  const server = http.createServer(app);
  const io = socketIo(server);

  app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));
  app.use(express.static(path.join(__dirname, 'static')));

  io.on('connection', handleSocket(tests));

  server.listen(port);
  console.log(`Listening on port ${port}.`);
};

const handleSocket = (tests) => (socket) => {
  socket.on('submit', (code) => {
    socket.emit('clear');
    runTests(tests, socket, code);
  });
};

const runTests = (tests, socket, code) => {
  const start = async () => {
    // Use a standard for loop to run one test at a time
    const filePath = path.join(process.cwd, uuid());
    await fs.writeFile(filePath, code, 'utf-8');
    for (test of tests) await runTest(test, (v) => socket.emit('result', v, filePath));
    await fs.unlink(filePath);
  };

  enqueue(socket.id, start);
};

const runTest = async (
  {
    compileCommand = null,
    compileTimeout = 1000,
    runCommand = (file) => `${file}`,
    runTimeout = 1000,
    sendProgramOnStdin = false,
    stdin = null,
    stdout = null,
    printStdout = false,
  } = {},
  writeBack,
  filePath
) => {
  // TODO add compiler
};

module.exports = mooshakDaFeira;
