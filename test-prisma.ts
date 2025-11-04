import { prisma } from "./lib/prisma";

async function main() {
  const count = await prisma.reader.count();
  console.log("Reader count:", count);
}

main().then(() => process.exit());
