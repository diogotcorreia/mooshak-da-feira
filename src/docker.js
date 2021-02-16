const tar = require('tar-stream');
const Docker = require('dockerode');
const docker = new Docker();

const generateUlimits = ({ time = 1, memory = 64 }) => [{ Name: 'cpu', Soft: time, Hard: time }];

const startContainer = async ({ profile, exec, files, stdin }, writeBack) => {
  const container = await docker.createContainer({
    Image: profile.image,
    OpenStdin: true,
    StdinOnce: true,
    Tty: true,
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

  await container.start();

  // Attach to stdin, stdout and stderr
  await new Promise((resolve) =>
    container.attach(
      { stream: true, stdin: true, stdout: true, stderr: true },
      function (_err, stream) {
        stream.write(stdin);

        stream.pipe(writeBack);
        stream.on('close', resolve);
        stream.on('end', resolve);
        stream.on('error', resolve);
      }
    )
  );
};

module.exports = { startContainer };
