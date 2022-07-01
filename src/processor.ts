import {lookupArchive} from "@subsquid/archive-registry"
import * as ss58 from "@subsquid/ss58"
import {BatchContext, BatchProcessorItem, SubstrateBatchProcessor} from "@subsquid/substrate-processor"
import {Store, TypeormDatabase} from "@subsquid/typeorm-store"
import {In} from "typeorm"
import {BalancesTransferEvent} from "./types/events"
import { Transfer } from "./model";


const processor = new SubstrateBatchProcessor()
    .setBatchSize(500)
    .setDataSource({
        // Lookup archive by the network name in the Subsquid registry
        archive: lookupArchive("moonriver", { release: "FireSquid" })

        // Use archive created by archive/docker-compose.yml
        // archive: 'http://localhost:8888/graphql'
    })
    .addEvent('Balances.Transfer', {
        data: {event: {args: true}}
    } as const)


type Item = BatchProcessorItem<typeof processor>
type Ctx = BatchContext<Store, Item>

processor.run(new TypeormDatabase(), async ctx => {
    let transfers = getTransfers(ctx)

    for (let t of transfers) {
      const transferred = new Transfer();
      transferred.id = t.id
      transferred.balance = t.balance;
      transferred.from = t.from
      transferred.to = t.to;

      // // only save a transfer if the to or from is one of the WMOVR contracts
      const WMOVR = ["0x98878b06940ae243284ca214f92bb71a2b032b8a", "0xe3c7487eb01c74b73b7184d198c7fbf46b34e5af", "0xf50225a84382c74cbdea10b0c176f71fc3de0c4d"]
      if (WMOVR.includes(transferred.from) || WMOVR.includes(transferred.to)){
        await ctx.store.save(transferred);
      }
    }
})

interface TransferEvent {
    id: string
    from: string
    to: string
    balance: bigint
}

function getTransfers(ctx: Ctx): TransferEvent[] {
    let transfers: TransferEvent[] = []
    for (let block of ctx.blocks) {
        for (let item of block.items) {
            if (item.name == "Balances.Transfer") {
                let e = new BalancesTransferEvent(ctx, item.event)
                let rec: {from: Uint8Array, to: Uint8Array, amount: bigint}
                if (e.isV49) {
                    let [from, to, value ] = e.asV49
                    rec = {from, to, amount: value}
                } else {
                    rec = e.asV1201
                }
                transfers.push({
                    id: item.event.id,
                    from: item.event.args[0],
                    to: item.event.args[1],
                    balance: item.event.args[2],
                })
            }
        }
    }
    return transfers
}
