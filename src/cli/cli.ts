import { Command } from "commander";
import { searchAndDownload } from "./searchAndDownload";

const progName = "maoer-download";
const program = new Command();

program
  .name(progName)
  .description("Download audio dramas & subtitles from Maoer FM")
  .version("1.0.0");

program
  .command("get", "download audio for a new audio drama")
  .action(async () => await searchAndDownload());

await program.parseAsync();
