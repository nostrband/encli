import { sha384 } from "@noble/hashes/sha2";
import { bytesToHex } from "@noble/hashes/utils";

export function pcrDigest(data: Buffer | Uint8Array | string) {
  return bytesToHex(
    sha384
      .create()
      // https://github.com/aws/aws-nitro-enclaves-cli/issues/446#issuecomment-1460766038
      // > The PCR registers start in a known zero state and each extend operation does a hash between the previous state and the data.
      .update(new Uint8Array(384 / 8))
      .update(data)
      .digest()
  );
}

