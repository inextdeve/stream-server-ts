import { Request, Response } from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const stream = (req: Request, res: Response) => {
  const { id, analytic } = req.params;

  return res.render(`${__dirname.split("dist")[0]}src/views/video.ejs`, {
    src: `http://localhost:${process.env.PORT}/streams/${id}/${analytic}/output.m3u8`,
  });
};

export { stream };
