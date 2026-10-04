/**
 * Schrijft de renderlijst voor alle productbeelden van de voorbeeldcatalogus.
 *   npx tsx scripts/product-renders/specs.ts > /tmp/specs.json
 */
import { existsSync } from "node:fs";

import { demoImageSpecs } from "../../src/lib/catalog/demo-data";

const size = Number(process.env.RENDER_SIZE ?? 1200);
const onlyMissing = process.argv.includes("--missing");

const jobs = [...demoImageSpecs]
  .map(([file, spec]) => ({ out: `public/products/${file}`, file, spec: { ...spec, size } }))
  .filter((job) => !onlyMissing || !existsSync(`public/products/${job.file}`));

process.stdout.write(JSON.stringify(jobs, null, 1));
