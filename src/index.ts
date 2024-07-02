import { cameras } from "@prisma/client";
import Stream from "./stream.js";
import prisma from "./config/prisma.js";

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
      (camera) => Number(camera?.address?.length) > 2
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
      delete this.streams[id];

      const camera = await this.fetchCamera(id);

      this.streams[camera.id] = new Stream({
        id: camera.id,
        analyticType: 0,
        url: camera.address as string,
      });

      this.streams[camera.id].run();
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
    } catch (error) {
      console.log(error);
    }
  }
}

const app = new App();

// setTimeout(async () => {
//   let c = 0;
//   for (let key in app.streams) {
//     c++;
//   }
//   console.log(c);
// }, 8000);
app.run();
