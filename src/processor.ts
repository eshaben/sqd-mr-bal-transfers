import {
  EventHandlerContext,
  SubstrateProcessor,
} from "@subsquid/substrate-processor";
import { lookupArchive } from "@subsquid/archive-registry";
import { Transfer } from "./model";
import { BalancesTransferEvent } from "./types/events";

const processor = new SubstrateProcessor("moonriver-balance-transfers");

processor.setBatchSize(500);
processor.setDataSource({
  archive: lookupArchive("moonriver")[0].url,
  chain: "wss://moonriver.api.onfinality.io/public-ws",
});
processor.setBlockRange({from: 0})

processor.addEventHandler("balances.Transfer", async (ctx: EventHandlerContext) => {
  const event = getTransferEvent(ctx);

  
  const transferred = new Transfer();
  transferred.id = ctx.event.id;
  transferred.balance = event.amount;
  transferred.from = ctx.event.params[1].value as string;
  transferred.to = ctx.event.params[2].value as string;

  // // only save a transfer if the to or from is one of the WGLMR contracts
  const WMOVR = ["0x98878B06940aE243284CA214f92Bb71a2b032B8A", "0xE3C7487Eb01C74b73B7184D198c7fBF46b34E5AF", "0xf50225a84382c74CbdeA10b0c176f71fc3DE0C4d"]
  if (WMOVR.includes(transferred.from) || WMOVR.includes(transferred.to)){
    await ctx.store.save(transferred);
  }
});

function getTransferEvent(ctx: EventHandlerContext) {
  const event = new BalancesTransferEvent(ctx);

  if (event.isV49) {
    const [from, to, value] = event.asV49;
    return {from, to, amount: value};
  } else {
    return event.asV1201
  }
}

processor.run();
