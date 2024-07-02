import { cameras } from "@prisma/client";
import Stream from "./stream.js";
import prisma from "../config/prisma.js";
import removeSubfolders from "../utils/utils.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

class App {
  private streams: { [key: string]: Stream };
  private cameras: cameras[];

  constructor() {
    this.cameras = [];
    this.streams = {};
  }

  public async run() {
    try {
      await this.fetchCameras();
      this.startStreams();
    } catch (error) {
      console.log(error);
    }
  }

  private async fetchCameras() {
    const cameras = await prisma.cameras.findMany();

    if (cameras.length < 1) {
      throw Error("There is no cameras");
    }

    this.cameras = cameras.filter(
      (camera) => Number(camera?.address?.length) > 2 && camera.enabled
    );
  }

  private async fetchCamera(id: number) {
    const camera = await prisma.cameras.findFirst({ where: { id } });

    if (camera === null) {
      throw Error("There is no cameras");
    }

    this.cameras = this.cameras.map((cam) => {
      if (cam.id === id) {
        return camera;
      }
      return cam;
    });
    return camera;
  }

  private startStreams() {
    if (this.cameras.length)
      this.cameras.forEach((camera) => {
        this.streams[camera.id] = new Stream({
          id: camera.id,
          analyticType: 0,
          url: camera.address as string,
          soundReception: camera.sound,
        });

        this.streams[camera.id]
          .on("error", (error, id) => {
            this.streams[id].kill();
            delete this.streams[id];
          })
          .run();
      });
    return this;
  }

  public async update(id: number) {
    if (!!this.streams[id] && this.streams[id] instanceof Stream) {
      this.streams[id].kill();

      try {
        const camera = await this.fetchCamera(id);

        if (!camera || !camera.enabled) {
          delete this.streams[id];
          return true;
        }

        this.streams[camera.id] = new Stream({
          id: camera.id,
          analyticType: 0,
          url: camera.address as string,
        });
        removeSubfolders(__dirname.split("dist")[0] + `/streams/${id}/0`);
        this.streams[camera.id].run();
      } catch (error) {
        return false;
      }
    }

    return true;
  }

  public async revalidate() {
    for (let key in this.streams) {
      this.streams[key].kill();
    }

    this.streams = {};
    this.cameras = [];

    try {
      await this.fetchCameras();
      this.startStreams();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}

// const app = new App();

// setTimeout(async () => {
//   let c = 0;
//   for (let key in app.streams) {
//     c++;
//   }
//   console.log(c);
// }, 8000);
// app.run();

const streamApp = new App();
export { streamApp };
