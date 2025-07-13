import { execSync } from "node:child_process";
import { lookup } from "node:dns/promises";
import url from "node:url";

function getProxy(): string | undefined {
  if (process.env.https_proxy) {
    return process.env.https_proxy;
  }

  try {
    const https_proxy = execSync("npm config get https-proxy")
      .toString()
      .trim();
    return https_proxy !== "null" ? https_proxy : undefined;
  } catch (error) {
    return;
  }
}

export async function getOnline(): Promise<boolean> {
  try {
    await lookup("registry.yarnpkg.com");
    return true;
  } catch {
    const proxy = getProxy();
    if (!proxy) {
      return false;
    }

    const { hostname } = url.parse(proxy);
    if (!hostname) {
      return false;
    }
    try {
      return true;
    } catch (error) {
      return false;
    }
  }
}
