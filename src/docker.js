const tar = require('tar-stream');
const Docker = require('dockerode');
const { v4: uuid } = require('uuid');
const docker = new Docker();

const generateUlimits = ({ time = 1, memory = 64 }) => [{ Name: 'cpu', Soft: time, Hard: time }];

const startContainer = async ({ profile, exec, files, stdin }, writeBack, dockerVolume) => {
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
      Binds: dockerVolume ? [`${dockerVolume.name}:${dockerVolume.mount}:rw`] : [],
    },
  });

  // Add files to container
  if (Object.keys(files).length > 0) {
    const pack = tar.pack();
    Object.entries(files).forEach(([name, content]) => pack.entry({ name }, content));
    pack.finalize();
    await container.putArchive(pack, { path: '/sandbox' });
  }

  // Attach to stdin, stdout and stderr
  await new Promise((resolve) => {
    container.attach(
      { stream: true, stdin: true, stdout: true, stderr: true },
      function (_err, stream) {
        stream.write(stdin);

        stream.pipe(writeBack);
        stream.on('close', resolve);
        stream.on('end', resolve);
        stream.on('error', resolve);
      }
    );
    container.start();
  });

  try {
    await container.stop();
  } catch (ignore) {
    // Container already stopped on its own
  }
  await container.remove();
};

const getNewVolume = async ({ mount = '/sandbox' } = {}) => {
  const name = `mooshak-da-feira-${uuid()}`;
  const volume = await docker.createVolume({
    Name: name,
  });

  return {
    mount,
    name,
    volume,
    remove: () => volume.remove(),
  };
};

module.exports = { startContainer, getNewVolume };
