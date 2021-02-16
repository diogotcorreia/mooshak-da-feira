const tar = require('tar-stream');
const Docker = require('dockerode');
const Stream = require('stream');
const docker = new Docker();

const generateUlimits = ({ time = 1, memory = 64 }) => [{ Name: 'cpu', Soft: time, Hard: time }];

const startContainer = async ({ profile, exec, files, stdin }, writeBack) => {
  const container = await docker.createContainer({
    Image: profile.image,
    OpenStdin: true,
    WorkingDir: '/sandbox',
    Cmd: ['/bin/sh', '-c', exec || 'true'],
    NetworkDisabled: !profile.network,
    HostConfig: {
      Ulimits: generateUlimits(profile.limits),
    },
  });

  // Add files to container
  const pack = tar.pack();

  Object.entries(files).forEach(([name, content]) => pack.entry({ name }, content));

  pack.finalize();

  await container.putArchive(pack, { path: '/sandbox' });

  container.attach(
    { stream: true, stdin: true, stdout: true, stderr: true },
    function (err, stream) {
      const readableStream = new Stream.Readable({
        read() {},
      });
      readableStream.push(stdin);
      readableStream.pipe(stream);

      container.modem.demuxStream(stream, writeBack, writeBack);
    }
  );

  await container.start();
};

module.exports = { startContainer };
