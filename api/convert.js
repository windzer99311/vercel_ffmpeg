import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import Busboy from "busboy";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Only POST allowed");
  }

  const busboy = Busboy({ headers: req.headers });
  let fileBuffer;

  await new Promise((resolve, reject) => {
    busboy.on("file", (_, file) => {
      const chunks = [];
      file.on("data", d => chunks.push(d));
      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
        resolve();
      });
    });
    req.pipe(busboy);
  });

  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js"
  });

  await ffmpeg.writeFile("input.mp4", await fetchFile(fileBuffer));

  // Example: convert MP4 → MP3
  await ffmpeg.exec([
    "-i", "input.mp4",
    "-vn",
    "-acodec", "libmp3lame",
    "output.mp3"
  ]);

  const output = await ffmpeg.readFile("output.mp3");

  res.setHeader("Content-Type", "audio/mpeg");
  res.send(Buffer.from(output.buffer));
}
