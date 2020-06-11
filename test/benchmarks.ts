/* eslint no-console: "off" */
import { Repository } from "nodegit";

(async function main() {
  const repo = await Repository.open("./benchmarks-tmp/bootstrap");
  const ref = await repo.getReference("v4.5.0");
  await repo.checkoutRef(ref);
})().catch((e) => {
  console.error(e);
});
