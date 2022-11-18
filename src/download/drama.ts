import axios from "axios";
import { dramaInfoPath, dramaSearchPath } from "../paths";
import { downloadAudio, getSoundPath } from "./audio";
import * as fs from "fs";
import PQueue from "p-queue";
import { pqueueConcurrency } from "../config";

interface DramaSearchResultInfo {
  info: { Datas: DramaSearchResult[] };
}

export interface DramaSearchResult {
  id: number;
  name: string;
  cover: string;
  author: string;
}

interface DramaInfo {
  info: FullDramaDetails;
}

interface FullDramaDetails {
  drama: DramaSearchResult;
  episodes: { episode: Episode[] };
}

export interface Episode {
  id: number;
  sound_id: number;
  name: string;
}

export interface EpisodeForDownload {
  sound_id: number;
  name: string;
  soundurl: string;
}

export interface DramaForDownload {
  name: string;
  episodes: EpisodeForDownload[];
}

// Use this to get drama id only. Episode lists returned from here are not complete.
export async function searchDramaByName(
  dramaName: string,
  limit?: number
): Promise<DramaSearchResult[]> {
  try {
    const response = await axios.get<DramaSearchResultInfo>(dramaSearchPath, {
      params: { s: dramaName, page: 1 },
    });
    if (limit) {
      return response.data.info.Datas.slice(0, limit);
    } else {
      return response.data.info.Datas;
    }
  } catch (err) {
    console.error("Couldn't get drama by name");
    return [];
  }
}

// Search for complete drama download details with all episodes.
export async function getDramaForDownload(
  dramaId: number
): Promise<FullDramaDetails | null> {
  try {
    const response = await axios.get<DramaInfo>(dramaInfoPath, {
      params: { drama_id: dramaId },
    });
    return response.data.info;
  } catch (err) {
    console.error("Couldn't get drama by name");
    return null;
  }
}

async function processDramaForDownload(
  drama: DramaSearchResult,
  cookie?: string
): Promise<EpisodeForDownload[]> {
  // Query deeper for drama details
  const completeDrama = await getDramaForDownload(drama.id);
  if (!completeDrama) {
    console.log(`Couldn't find complete drama details for ${drama.name}`);
    return [];
  }

  // Queue with limited concurrency so we don't get blacklisted
  const queue = new PQueue({ concurrency: pqueueConcurrency });

  const episodesSoundPaths = await queue.addAll(
    completeDrama.episodes.episode.map(
      (episode) => () => getSoundPath(episode.sound_id, cookie)
    )
  );

  return completeDrama.episodes.episode
    .map((episode, index) => {
      const soundUrl = episodesSoundPaths[index];
      if (!soundUrl) {
        return null;
      } else {
        return {
          ...episode,
          soundurl: soundUrl,
        };
      }
    })
    .filter(isNotNullorUndefined);
}

export async function processDramasForDownload(
  dramas: DramaSearchResult[],
  cookie?: string
): Promise<DramaForDownload[]> {
  const dramaEpisodesForDownload = await Promise.all(
    dramas.map((drama) => processDramaForDownload(drama, cookie))
  );

  return dramas.map((drama, index) => ({
    ...drama,
    episodes: dramaEpisodesForDownload[index],
  }));
}

async function downloadEpisodesForDrama(
  drama: DramaForDownload,
  downloadPath: string
): Promise<void> {
  await fs.promises.mkdir(getDownloadPathToDrama({ downloadPath, drama }), {
    recursive: true,
  });

  // Queue with limited concurrency so we don't get blacklisted
  const queue = new PQueue({ concurrency: pqueueConcurrency });

  await queue.addAll(
    drama.episodes.map(
      (episode) => () =>
        downloadAudio(
          episode.soundurl,
          getDownloadPathToFile({ downloadPath, drama, episode })
        )
    )
  );
}

export async function downloadDramas(
  dramas: DramaForDownload[],
  downloadPath: string
): Promise<void> {
  await Promise.all(
    dramas.map((drama) => downloadEpisodesForDrama(drama, downloadPath))
  );
}

function getDownloadPathToDrama({
  downloadPath,
  drama,
}: {
  downloadPath: string;
  drama: DramaForDownload;
}) {
  return `${downloadPath}/${drama.name}`;
}

function getDownloadPathToFile({
  downloadPath,
  drama,
  episode,
}: {
  downloadPath: string;
  drama: DramaForDownload;
  episode: EpisodeForDownload;
}) {
  return `${getDownloadPathToDrama({
    downloadPath,
    drama,
  })}/${episode.name}.mp4`;
}

function isNotNullorUndefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
