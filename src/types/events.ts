import assert from 'assert'
import {Chain, ChainContext, EventContext, Event, Result} from './support'
import * as v49 from './v49'
import * as v1201 from './v1201'

export class BalancesTransferEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'Balances.Transfer')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   *  Transfer succeeded. \[from, to, value\]
   */
  get isV49(): boolean {
    return this._chain.getEventHash('Balances.Transfer') === 'dfcae516f053c47e7cb49e0718f01587efcb64cea4e3baf4c6973a29891f7841'
  }

  /**
   *  Transfer succeeded. \[from, to, value\]
   */
  get asV49(): [v49.AccountId, v49.AccountId, v49.Balance] {
    assert(this.isV49)
    return this._chain.decodeEvent(this.event)
  }

  /**
   * Transfer succeeded.
   */
  get isV1201(): boolean {
    return this._chain.getEventHash('Balances.Transfer') === '23222c59f2992c12387568241620899d2d399ab9027595daca8255637f62ece3'
  }

  /**
   * Transfer succeeded.
   */
  get asV1201(): {from: v1201.AccountId20, to: v1201.AccountId20, amount: bigint} {
    assert(this.isV1201)
    return this._chain.decodeEvent(this.event)
  }
}
