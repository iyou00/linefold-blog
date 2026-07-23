import "server-only";
import type { Definition, Image, ImageReference } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

export function getMarkdownImageUrls(markdown: string) {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const definitions = new Map<string, string>();
  const urls: string[] = [];

  visit(tree, "definition", (node: Definition) => {
    definitions.set(node.identifier.toLowerCase(), node.url);
  });
  visit(tree, "image", (node: Image) => {
    urls.push(node.url);
  });
  visit(tree, "imageReference", (node: ImageReference) => {
    const url = definitions.get(node.identifier.toLowerCase());
    if (url) urls.push(url);
  });

  return [...new Set(urls.map((url) => url.trim()).filter(Boolean))];
}
