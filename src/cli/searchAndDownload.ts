import inquirer from "inquirer";
import {
  downloadDramas,
  DramaSearchResult,
  searchDramaByName,
  processDramasForDownload,
} from "../download/drama";
import { defaultDownloadPath } from "../paths";

export async function searchAndDownload() {
  const { dramaTitle } = await inquirer.prompt([
    {
      type: "input",
      name: "dramaTitle",
      message: "Search for a drama: ",
    },
  ]);

  const searchResults = await searchDramaByName(dramaTitle);
  if (searchResults.length === 0) {
    console.log(`Couldn't find any dramas by the name of ${dramaTitle}`);
    return;
  }

  const chosenDramas = await chooseDramas(searchResults);

  const { downloadPath, cookie } = await inquirer.prompt([
    {
      type: "input",
      name: "downloadPath",
      message: "Specify a download path to a folder: ",
      default: defaultDownloadPath,
    },
    {
      type: "input",
      name: "cookie",
      message: "Enter a cookie to access paid episodes if you have one: ",
    },
  ]);

  const dramasForDownload = await processDramasForDownload(
    chosenDramas,
    cookie
  );

  await downloadDramas(dramasForDownload, downloadPath);
}

async function chooseDramas(
  dramas: DramaSearchResult[]
): Promise<DramaSearchResult[]> {
  const { dramas: chosenDramas } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "dramas",
      choices: dramas.map((drama) => ({
        name: `${drama.name} by ${drama.author}`,
        value: drama,
      })),
      message: "Which dramas would you like to download?",
    },
  ]);
  return chosenDramas;
}
