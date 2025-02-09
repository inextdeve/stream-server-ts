import express from "express";
//@ts-ignore
import hls from "hls-server";
import dotenv from "dotenv";
import cors from "cors";
import * as fs from "fs";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import stream from "./api/routes/stream.js";
import api from "./api/routes/api.js";
import removeSubfolders from "./utils/utils.js";
import { streamApp } from "./core/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url)).split("dist")[0];

dotenv.config();

const app = express();
//Setting Cors
app.use(cors());

//Setting view engine to ejs
app.set("view engine", "ejs");

app.use("/stream", stream);

app.use("/api", api);

//test response
app.get("/stream/test", (req, res) => {
  res.json({ success: true });
});

const server = app.listen(process.env.PORT, () => {
  streamApp.run();

  // Remove all old streams
  const targetDirectory = path.join(__dirname, "streams"); // Replace 'your-directory-name' with your actual directory
  removeSubfolders(targetDirectory);
});

new hls(server, {
  provider: {
    exists: (req: any, cb: (arg: any, arg1: boolean) => void) => {
      const ext = req.url.split(".").pop();

      if (ext !== "m3u8" && ext !== "ts") {
        return cb(null, true);
      }
      const getFile = () => {
        fs.access(__dirname + req.url, fs.constants.F_OK, function (err) {
          if (err) {
            console.log(err);
            console.log("File not exist");
            return cb(null, false);
          }
          cb(null, true);
        });
      };
      //Get the m3u8
      getFile();
    },
    getManifestStream: (req: any, cb: any) => {
      const stream = fs.createReadStream(__dirname + req.url);
      cb(null, stream);
    },
    getSegmentStream: (req: any, cb: any) => {
      const stream = fs.createReadStream(__dirname + req.url);
      cb(null, stream);
    },
  },
});
