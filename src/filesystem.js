const fs = require('fs').promises;
const path = require('path');
const { v4: uuid } = require('uuid');

const generateFolder = async (workingDirectory) => {
  const folderPath = path.resolve(workingDirectory, uuid());

  await fs.mkdir(folderPath);

  return folderPath;
};

const deleteFolder = async (folderPath) => {
  await fs.rm(folderPath, { recursive: true });
};

const saveFile = (workingDirectory, fileName, contents) => {
  return fs.writeFile(path.resolve(workingDirectory, fileName), contents);
};

module.exports = {
  generateFolder,
  deleteFolder,
  saveFile,
};
