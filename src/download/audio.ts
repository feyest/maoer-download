import { audioInfoPath } from "../paths";
import axios from "axios";
import * as fs from "fs";

interface SoundInfo {
  id: number;
  catalog_id: 18;
  soundstr: string;
  soundurl?: string;
  soundurl_128?: string;
}

export interface AudioInfo {
  info: { sound: SoundInfo };
}

/**
 * Given the sound id, return the sound path (i.e. the path that gives you the
 * endpoint to hear the associated audio.
 *
 * Send cookie in to access paid dramas. You can find this using developer tools.
 */
export async function getSoundPath(
  soundId: number,
  cookie?: string
): Promise<string> {
  const response = await axios.get<AudioInfo>(audioInfoPath, {
    headers: cookie ? { cookie } : {},
    params: { soundid: soundId },
  });

  const soundUrl =
    response.data.info.sound.soundurl ?? response.data.info.sound.soundurl_128;

  if (soundUrl) {
    return soundUrl;
  } else {
    throw new Error("Couldn't fetch audio path");
  }
}

/** Downloads the audio. */
export async function downloadAudio(
  soundPath: string,
  downloadPath: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios({
        method: "get",
        url: soundPath,
        responseType: "stream",
      });
      if (response.headers["content-type"].includes("mp4")) {
        const stream = fs.createWriteStream(downloadPath);
        response.data.pipe(stream);
        stream.on("finish", () => resolve());
      } else {
        reject(new Error("Unexpected response type: not audio/mp4"));
      }
    } catch (err) {
      reject(err);
    }
  });
}
