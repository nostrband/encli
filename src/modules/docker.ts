import { exec } from "./utils";

export async function dockerInspect(uri: string) {
  const { code, err, out } = await exec("docker", ["image", "inspect", uri]);
  if (code !== 0) {
    console.log("Failed to inspect image", uri, err);
    throw new Error("Failed to inspect image");
  }

  const data = JSON.parse(out);
  const info = data[0] as {
    Id: string;
    Config: {
      Labels: Record<string, string>;
    };
  };

  if (!info.Id) throw new Error("No id in docker image");

  if (
    !info.Config.Labels ||
    !("signers" in info.Config.Labels) ||
    !("signer_relays" in info.Config.Labels) ||
    !("version" in info.Config.Labels)
  ) {
    console.log("signers, signer_relays and version labels are required");
    throw new Error("No required labels in docker image");
  }

  const parse = (s: string) =>
    s
      .split(",")
      .map((s) => s.trim())
      .filter((s) => !!s);

  const signers = parse(info.Config.Labels["signers"]);
  const signerRelays = parse(info.Config.Labels["signer_relays"]);
  const upgradeRelays = info.Config.Labels["upgrade_relays"]
    ? parse(info.Config.Labels["upgrade_relays"])
    : signerRelays;
  const version = info.Config.Labels["version"];

  return {
    id: info.Id,
    signers,
    signerRelays,
    upgradeRelays,
    version
  }
}