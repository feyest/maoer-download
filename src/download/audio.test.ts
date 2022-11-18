import { getSoundPath, downloadAudio } from "./audio";
import { defaultDownloadPath } from "../paths";

describe(getSoundPath, () => {
  it("gets the right sound url", async () => {
    // Little mushroom sound id
    expect(await getSoundPath(2955009)).toContain("");
  });
});

describe(downloadAudio, () => {
  it("downloads audio to the right path", async () => {
    const soundPath = await getSoundPath(2955009);
    console.log(soundPath);
    if (!soundPath) return;
    await downloadAudio(soundPath, defaultDownloadPath);
  }, 10000);
});
