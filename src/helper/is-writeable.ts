import { W_OK } from "constants";
import { access } from "node:fs/promises";

export async function isWriteable(dir: string): Promise<boolean> {
  try {
    await access(dir, W_OK);
    return true;
  } catch (error) {
    return false;
  }
}
