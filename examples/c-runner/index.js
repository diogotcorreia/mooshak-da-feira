const mooshakDaFeira = require('../../src/index');

mooshakDaFeira({
  profiles: {
    c: {
      image: 'stepik/epicbox-gcc:6.3.0',
      network: false,
      limits: {
        time: 1, // In seconds
        memory: 64, // in MiB
      },
    },
  },
  tests: [
    {
      profile: 'c',
      exec: 'gcc main.c -o main',
      files: {
        'main.c': '%mooshak_da_feira_code%', // %mooshak_da_feira_code% will be replaced with the input from the user
      },
      stdin: '', // you can pass %mooshak_da_feira_code% here as well (although not recommended)
    },
    {
      profile: 'c',
      exec: './main',
      files: {}, // No need to add more files, since they are already in the container
      stdin: '',
    },
  ],
  port: 5000,
});
