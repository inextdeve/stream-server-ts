import { Request, Response } from "express";
import { streamApp } from "../../core/index.js";

const revalidate = async (req: Request, res: Response) => {
  const revalidateStreams = await streamApp.revalidate();
  if (revalidateStreams) return res.json({ success: true });
  return res.json({ error: "INTERNAL SERVER ERROR" });
};
const update = (req: Request, res: Response) => {
  const { id } = req.params;

  console.log("Recieve update:", id);

  const updateStream = streamApp.update(Number(id));

  return res.json({ success: true });
};
export { revalidate, update };
