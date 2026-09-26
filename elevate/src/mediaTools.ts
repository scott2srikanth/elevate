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
