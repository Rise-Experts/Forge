/**
 * Building and reading RFC 5322 messages — REQ-054 (#232), task #234, AC-4 and AC-6.
 *
 * Gmail's API takes a raw, base64url-encoded message rather than structured fields, so this package has to
 * construct one correctly. Two things in that are silent when wrong, which is why they get their own module
 * and their own tests:
 *
 * **A non-ASCII subject.** A header is ASCII-only by the spec. Putting `Rückfrage` in one raw does not throw —
 * it arrives as mojibake in somebody's inbox, and nobody tells you. RFC 2047 encoded-words are the fix, and
 * they are fiddly enough that hand-rolling them per caller guarantees at least one gets it wrong.
 *
 * **Threading.** A reply needs `In-Reply-To` and `References` carrying the *original's* `Message-ID`. Get it
 * wrong and the reply is delivered perfectly — as a new thread. The recipient sees an orphaned message with no
 * context, and the sender sees a sent mail that looks fine. This is the classic defect the AC names, and it
 * cannot be caught by anything except reading the headers of a real fetched message.
 */

/** Base64url, which is what Gmail's `raw` field wants — not base64. */
export const toBase64Url = (value: string): string =>
  Buffer.from(value, "utf8").toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");

export const fromBase64Url = (value: string): string =>
  Buffer.from(value.replaceAll("-", "+").replaceAll("_", "/"), "base64").toString("utf8");

/**
 * The RFC 5322 pieces now live in `@forge/agentkit/tools`, and are re-exported here.
 *
 * They moved when `tools-email` (#241) needed the same encoder. Header encoding and the CRLF-injection guard
 * are exactly the kind of rule that must have one implementation: both fail *silently* when wrong — mojibake
 * in somebody's inbox, or a `Bcc` nobody meant to add — so a second copy is the one that quietly lacks the
 * fix. `buildMessage` grew `multipart/alternative` and attachments in the move; the single-body path this
 * package uses is byte-identical, which is what the tests below assert and what made the move safe.
 */
export { assertHeaderSafe, buildMessage, encodeHeader } from "@forge/agentkit/tools";
export type { OutgoingMessage } from "@forge/agentkit/tools";

export const headerOf = (
  headers: readonly { readonly name?: unknown; readonly value?: unknown }[] | undefined,
  wanted: string,
): string | undefined => {
  for (const header of headers ?? []) {
    if (typeof header.name === "string" && header.name.toLowerCase() === wanted.toLowerCase()) {
      return typeof header.value === "string" ? header.value : undefined;
    }
  }
  return undefined;
};

/**
 * HTML reduced to something a model can read.
 *
 * Not a renderer. Scripts and styles are dropped entirely — their content is not prose and would otherwise
 * arrive as a wall of CSS — block tags become newlines, and everything else is stripped. A marketing email
 * flattened this way is ugly and legible, which is the right trade for a tool whose output goes into a context
 * window.
 */
export const htmlToText = (html: string): string =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

type Part = {
  readonly mimeType?: unknown;
  readonly body?: { readonly data?: unknown; readonly size?: unknown };
  readonly parts?: readonly Part[];
  readonly filename?: unknown;
};

/**
 * The readable body of a Gmail payload.
 *
 * A message is a tree of parts, and the useful one is buried at an arbitrary depth. Plain text is preferred
 * over HTML where both exist — which is the common case for anything sent by a real mail client — and HTML is
 * reduced only when there is no alternative.
 *
 * Attachments are skipped by filename rather than by mime type: a PDF attachment and an inline image are both
 * `application/*`, and only the filename distinguishes "part of the message" from "a file that came with it".
 */
export const bodyOf = (payload: Part | undefined): { text: string; hadHtmlOnly: boolean } => {
  if (payload === undefined) return { text: "", hadHtmlOnly: false };

  const plain: string[] = [];
  const html: string[] = [];

  const walk = (part: Part): void => {
    const filename = typeof part.filename === "string" ? part.filename : "";
    if (filename !== "") return; // an attachment, not the message
    const mime = typeof part.mimeType === "string" ? part.mimeType : "";
    const data = part.body?.data;
    if (typeof data === "string" && data !== "") {
      if (mime === "text/plain") plain.push(fromBase64Url(data));
      else if (mime === "text/html") html.push(fromBase64Url(data));
    }
    for (const child of part.parts ?? []) walk(child);
  };
  walk(payload);

  if (plain.length > 0) return { text: plain.join("\n").trim(), hadHtmlOnly: false };
  if (html.length > 0) return { text: htmlToText(html.join("\n")), hadHtmlOnly: true };
  return { text: "", hadHtmlOnly: false };
};
