import {
  EventHandlerContext,
  SubstrateProcessor,
} from "@subsquid/substrate-processor";
import { lookupArchive } from "@subsquid/archive-registry";
import { Transfer } from "./model";
import { BalancesTransferEvent } from "./types/events";

const processor = new SubstrateProcessor("moonbeam-balance-transfers");

processor.setBatchSize(500);
processor.setDataSource({
  archive: lookupArchive("moonbeam")[0].url,
  chain: "wss://moonbeam.api.onfinality.io/public-ws",
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
  const WGLMR = ["0xAcc15dC74880C9944775448304B263D191c6077F", "0xe3DB50049C74De2F7d7269823af3178Cf22fd5E3", "0x5f6c5C2fB289dB2228d159C69621215e354218d7"]
  if (WGLMR.includes(transferred.from) || WGLMR.includes(transferred.to)){
    await ctx.store.save(transferred);
  }
});

function getTransferEvent(ctx: EventHandlerContext) {
  const event = new BalancesTransferEvent(ctx);

  if (event.isV900) {
    const [from, to, value] = event.asV900;
    return {from, to, amount: value};
  } else {
    return event.asV1201
  }
}

processor.run();
