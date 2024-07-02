import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import Ffmpeg, { FfmpegCommand } from "fluent-ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import findRemoveSync from "find-remove";
import { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import EventEmitter from "events";
ffmpeg.setFfmpegPath("/opt/homebrew/bin/ffmpeg");

const __dirname = dirname(fileURLToPath(import.meta.url));

interface StreamProps {
  url: string;
  soundReception?: boolean;
  codecName?: "h264";
  narrowBandwidthCamera?: boolean;
  id: number | string | undefined;
  analyticType: number | string | undefined;
}

class Stream extends EventEmitter {
  public path: string = "";
  private ffmpeg: FfmpegCommand | undefined = undefined;

  private url: string;
  private codecName?: "h264";
  private soundReception?: boolean;
  private narrowBandwidthCamera: boolean;

  private id: number | string | undefined;
  private analyticType: number | string | undefined;

  constructor(props: StreamProps) {
    super();
    console.log(props.url);
    this.url = props.url;
    this.codecName = props.codecName;
    this.soundReception = props.soundReception;
    this.narrowBandwidthCamera = !!props.narrowBandwidthCamera;

    this.id = props.id;
    this.analyticType = props.analyticType;

    try {
      this.init();
    } catch (error) {
      console.log("Cannot init the FFMPEG");
    }
  }

  private init() {
    if (this.soundReception) {
      this.ffmpeg = ffmpeg(this.url, { timeout: 432000 });
    } else {
      this.ffmpeg = ffmpeg(this.url, { timeout: 432000 }).noAudio();
    }
    this.ffmpeg
      .videoBitrate(1024)
      .videoCodec("libx264")
      .addOption("-hls_time", "10")
      // include all the segments in the list
      .addOption("-hls_list_size", "0")
      .on("error", (error) => {
        this.emit("error", error.message, this.id);
        console.log("Error", error.message);
      })
      .once("codecData", () => {
        console.log("codec start");
        //Set interval for removing .ts file older than 30s
        setInterval(() => {
          findRemoveSync(
            `${__dirname.split("dist")[0]}streams/${this.id}/${
              this.analyticType
            }`,
            { age: { seconds: 60 }, extensions: ".ts" }
          );
        }, 60000);

        this.path = `http://localhost:${process.env.PORT}/streams/${this.id}/${this.analyticType}/output.m3u8`;
      })
      .on("start", () => {
        findRemoveSync(
          `${__dirname.split("dist")[0]}streams/${this.id}/${
            this.analyticType
          }`,
          {
            extensions: [".ts", ".m3u8"],
          }
        );
        console.log("FFMPEG Start");
      })
      .on("end", () => {
        console.log("end");
        findRemoveSync(
          `${__dirname.split("dist")[0]}streams/${this.id}/${
            this.analyticType
          }`,
          {
            extensions: [".ts", ".m3u8"],
          }
        );
      });
  }

  public run() {
    // check if directory exists and create them
    if (!fs.existsSync(`${__dirname.split("dist")[0]}streams/${this.id}`))
      fs.mkdirSync(`${__dirname.split("dist")[0]}streams/${this.id}`);

    if (
      !fs.existsSync(
        `${__dirname.split("dist")[0]}streams/${this.id}/${this.analyticType}`
      )
    )
      fs.mkdirSync(
        `${__dirname.split("dist")[0]}streams/${this.id}/${this.analyticType}`
      );

    if (this.ffmpeg instanceof Ffmpeg)
      this.ffmpeg
        .output(
          `${__dirname.split("dist")[0]}streams/${this.id}/${
            this.analyticType
          }/output.m3u8`
        )
        .run();
  }

  public kill() {
    if (this.ffmpeg instanceof Ffmpeg) this.ffmpeg.kill("SIGKILL");
  }
}

export default Stream;
