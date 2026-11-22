import { NextResponse } from "next/server";

/** Bing Webmaster Tools ownership file; the code is the account's, the same on every site. */
const BING_AUTH_CODE = "254BB797E7FCF6CCA6F453F8748E0DEB";

export function GET() {
  return new NextResponse(`<?xml version="1.0"?>\n<users>\n\t<user>${BING_AUTH_CODE}</user>\n</users>\n`, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
}
