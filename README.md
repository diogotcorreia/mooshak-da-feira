# Mooshak Da Feira

Easily create unit tests for any program written in any programming language!

## About

The name of this project comes from [Mooshak](https://mooshak.dcc.fc.up.pt/), a code judging program.
This project aims to be a simpler, lightweight, customizable and student focused version of that.  
Its main purpose is to allow any student to test their code before submitting it to the oficial judge.

## Features

- Dark Mode (obviously)
- Supports compiled (C, Java, etc) and interpreted (Python, JavaScript, etc) languages
- Run tests throught `stdin` and `stdout` or write your own evaluator code
- Highly configurable through a JS file
- Execution time limit (kill program if it takes too much time to run)

## Examples

Usage examples will be available on the `examples` folder.

### Configuration options

The following object can be passed to the `mooshakDaFeira` function:

```js
mooshakDaFeira({
  profiles: {
    python: {
      image: 'python:3.9.1-alpine3.13',
      network: false,
      limits: {
        time: 1, // In seconds
        memory: 128, // in MiB
      },
    },
  },
  tests: [
    {
      profile: 'python',
      exec: 'python3 test.py',
      files: {
        'test.py': 'your grader code here', // probably read from a file with 'fs'
        'code.py': '%mooshak_da_feira_code%', // %mooshak_da_feira_code% will be replaced with the input from the user
      },
      stdin: '', // you can pass %mooshak_da_feira_code% here as well
    },
  ],
  port: 5000,
});
```

## Contributing

Feel free to submit issues and pull requests.
