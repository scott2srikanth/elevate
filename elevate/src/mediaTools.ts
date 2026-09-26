import { Platform } from "react-native";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
export async function compressImage(uri: string) {
  const ctx = ImageManipulator.manipulate(uri);
  ctx.resize({ width: 1200 });
  const image = await ctx.renderAsync();
  const result = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.75,
  });
  return result.uri;
}
export async function videoFrames(uri: string): Promise<string[]> {
  if (Platform.OS === "web") {
    const video = document.createElement("video");
    video.muted = true;
    video.preload = "auto";
    video.src = uri;
    const wait = (event: string) =>
      new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          clean();
          reject(
            new Error("The video could not be decoded. Try a short MP4 clip."),
          );
        }, 15000);
        const done = () => {
          clean();
          resolve();
        };
        const fail = () => {
          clean();
          reject(new Error("Unsupported video format."));
        };
        const clean = () => {
          clearTimeout(timer);
          video.removeEventListener(event, done);
          video.removeEventListener("error", fail);
        };
        video.addEventListener(event, done, { once: true });
        video.addEventListener("error", fail, { once: true });
      });
    try {
      await wait("loadedmetadata");
      if (!Number.isFinite(video.duration) || video.duration > 120)
        throw new Error("Choose a video of two minutes or less.");
      const result: string[] = [];
      for (const fraction of [0.15, 0.5, 0.85]) {
        const done = wait("seeked");
        video.currentTime = Math.max(0.01, video.duration * fraction);
        await done;
        const canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = Math.round(
          (800 * video.videoHeight) / video.videoWidth,
        );
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Video preview is unavailable.");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        result.push(canvas.toDataURL("image/jpeg", 0.75));
      }
      return result;
    } finally {
      video.removeAttribute("src");
      video.load();
    }
  }
  const { createVideoPlayer } = await import("expo-video");
  const player = createVideoPlayer(null);
  try {
    await player.replaceAsync(uri);
    if (player.status !== "readyToPlay")
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          subscription.remove();
          reject(new Error("Video loading timed out."));
        }, 15000);
        const subscription = player.addListener("statusChange", (event) => {
          if (event.status === "readyToPlay") {
            clearTimeout(timer);
            subscription.remove();
            resolve();
          } else if (event.status === "error") {
            clearTimeout(timer);
            subscription.remove();
            reject(new Error("Unable to load this video."));
          }
        });
      });
    if (player.duration > 120)
      throw new Error("Choose a video of two minutes or less.");
    const thumbnails = await player.generateThumbnailsAsync(
      [0.15, 0.5, 0.85].map((f) => player.duration * f),
      { maxWidth: 800 },
    );
    const result: string[] = [];
    for (const thumb of thumbnails) {
      const ctx = ImageManipulator.manipulate(thumb);
      const image = await ctx.renderAsync();
      result.push(
        (await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.75 }))
          .uri,
      );
    }
    return result;
  } finally {
    player.release();
  }
}
