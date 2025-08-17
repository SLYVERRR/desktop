import { fetch } from "@tauri-apps/plugin-http";
import * as cheerio from "cheerio";
import type { MangaDl } from "@/interfaces";
import type { Favorite, Chapter, Language } from "@/types";

export class MangaSwatDl implements MangaDl {
  baseUrl = "https://swatscans.com";
  isMultiLanguage = false;

  async getMangaByUrl(url: string): Promise<Favorite> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load manga at ${url}`);
    const html = await response.text();
    const $ = cheerio.load(html);

    const name = $("h1.entry-title").first().text().trim();
    const cover = $(".summary_image img").attr("src") ?? "";
    const description = $(".summary__content").text().trim();

    return {
      id: 0,
      source_id: url.split("/").filter(Boolean).pop() ?? "",
      name,
      folder_name: encodeURIComponent(name),
      link: url,
      cover,
      description,
      source: "MangaSwat",
    };
  }

  async search(query: string, limit = 20): Promise<Favorite[]> {
    const response = await fetch(`${this.baseUrl}/?s=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`Search failed: ${response.status}`);
    const html = await response.text();
    const $ = cheerio.load(html);
    const results: Favorite[] = [];

    $(".c-tabs-item__content").each((_, el) => {
      if (results.length >= limit) return;
      const titleEl = $(el).find(".post-title a");
      const name = titleEl.text().trim();
      const link = titleEl.attr("href") ?? "";
      const cover = $(el).find("img").attr("src") ?? "";

      results.push({
        id: 0,
        source_id: link.split("/").filter(Boolean).pop() ?? "",
        name,
        folder_name: encodeURIComponent(name),
        link,
        cover,
        source: "MangaSwat",
      });
    });

    return results;
  }

  async getChapters(mangaUrl: string): Promise<Chapter[]> {
    const response = await fetch(mangaUrl);
    if (!response.ok) throw new Error(`Failed to fetch chapters: ${response.status}`);
    const html = await response.text();
    const $ = cheerio.load(html);
    const chapters: Chapter[] = [];

    $(".wp-manga-chapter a").each((_, el) => {
      const title = $(el).text().trim();
      const link = $(el).attr("href") ?? "";

      chapters.push({
        number: title,
        title,
        chapter_id: link,
        source: "MangaSwat",
        language: "ar",
      });
    });

    return chapters;
  }

  async getChapterImages(chapterUrl: string): Promise<string[]> {
    const response = await fetch(chapterUrl);
    if (!response.ok) throw new Error(`Failed to load images: ${response.status}`);
    const html = await response.text();
    const $ = cheerio.load(html);

    const images: string[] = [];
    $(".reading-content img").each((_, el) => {
      const src = $(el).attr("src");
      if (src) images.push(src);
    });

    return images;
  }

  async getFavoriteLanguages(_: string): Promise<Language[]> {
    return [{ id: "ar", label: "العربية" }];
  }
}
