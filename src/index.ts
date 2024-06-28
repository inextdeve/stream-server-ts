import { cameras } from "@prisma/client";
import Stream from "./stream.js";
import prisma from "./db/config/prisma.js";
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

  private startStreams() {
    if (this.cameras.length)
      this.cameras.forEach((camera) => {
        this.streams[camera.id] = new Stream({
          id: camera.id,
          analyticType: 0,
          url: camera.address as string,
        });
        this.streams[camera.id].run();
      });
  }
}

const app = new App();
app.run();
