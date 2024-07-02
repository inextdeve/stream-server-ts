import fs from "node:fs";
import path from "node:path";

const removeSubfolders = (dir: string) => {
  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${dir}: ${err.message}`);
      return;
    }

    files.forEach((file) => {
      const fullPath = path.join(dir, file);

      fs.stat(fullPath, (err, stats) => {
        if (err) {
          console.error(
            `Error getting stats of file ${fullPath}: ${err.message}`
          );
          return;
        }

        if (stats.isDirectory()) {
          // Recursively remove contents of the subdirectory
          fs.rm(fullPath, { recursive: true, force: true }, (err) => {
            if (err) {
              console.error(
                `Error removing directory ${fullPath}: ${err.message}`
              );
            } else {
              console.log(`Removed directory ${fullPath}`);
            }
          });
        }
      });
    });
  });
};

export default removeSubfolders;
