/* eslint-disable @next/next/no-img-element -- Article images use validated external object-storage URLs. */
import ReactMarkdown, { type UrlTransform } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { isAllowedHttpsImageUrl, safeMarkdownLink } from "@/lib/url-policy";

type Props = {
  markdown: string;
  allowedImageHosts: string[];
  emptyText?: string;
};

export function MarkdownContent({ markdown, allowedImageHosts, emptyText }: Props) {
  if (!markdown.trim()) return emptyText ? <p>{emptyText}</p> : null;

  const transformUrl: UrlTransform = (url, key, node) => {
    if (node.tagName === "img" && key === "src") {
      return isAllowedHttpsImageUrl(url, allowedImageHosts) ? url : undefined;
    }
    if (node.tagName === "a" && key === "href") return safeMarkdownLink(url) || undefined;
    return undefined;
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      skipHtml
      urlTransform={transformUrl}
      components={{
        h1: ({ node: _node, children, ...props }) => {
          void _node;
          return <h2 {...props}>{children}</h2>;
        },
        a: ({ node: _node, href, children, ...props }) => {
          void _node;
          const external = href?.startsWith("https://");
          return <a {...props} href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer noopener" : undefined}>{children}</a>;
        },
        img: ({ node: _node, src, alt, ...props }) => {
          void _node;
          if (typeof src !== "string" || !src) return null;
          return <img {...props} src={src} alt={alt || ""} loading="lazy" decoding="async" referrerPolicy="no-referrer" />;
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}
