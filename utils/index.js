const util = require("util");
const fs = require("fs");

const mkdir = util.promisify(fs.mkdir);
const stat = util.promisify(fs.stat);

const doesFolderOrFileExists = async (path) => {
    try {
        await stat(path);
        return true;
    } catch (e) {
        return false;
    }
};

const createUploadsFolder = async () => {
    if (!(await doesFolderOrFileExists("../uploads"))) {
        await mkdir("../uploads");
        console.log("Created folder: ::/uploads\n");
    }
};

function getFileSizeInBytes(file) {
    const stats = fs.statSync(file);
    const fileSizeInBytes = stats["size"];
    return fileSizeInBytes;
}

module.exports = { createUploadsFolder, getFileSizeInBytes };
