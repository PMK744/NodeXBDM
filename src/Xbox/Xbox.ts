import type { xbdm } from '../index'
import type { CommandsHandler } from './handlers/Commands'
import type { CommandResponse } from '../types'

import { Socket } from 'net'
import { EventEmitter } from 'events'
import { genUuid } from '../utils'
import AbstractHandler from './handlers/AbstractHandler'
import { defaultHandlers } from './handlers'

class Xbox extends EventEmitter {
  public readonly socket: Socket
  public readonly xbdm: xbdm
  public readonly ip: string
  public readonly runtimeId: string
  public readonly handlers: Map<string, AbstractHandler>

  public constructor(xbdm: xbdm, ip: string) {
    super()
    this.socket = new Socket()
    this.xbdm = xbdm
    this.ip = ip
    this.runtimeId = genUuid()
    this.handlers = new Map()
    this.socket.setNoDelay(true)
    this.socket.setKeepAlive(true)
  }

  public connect(callback: (connected?: boolean) => void): void {
      this.socket.connect({
        host: this.ip,
        port: 730,
      }, (data?) => {
        if (data === undefined) {
          this.socket.once('data', () => {
            this.loadHandlers()
            this.emit('Connected')
          })
        }

        if (data === undefined && callback) return callback(true)
  
        if (callback) return callback(false)
      })
      if (!this.xbdm.consoles.has(this.runtimeId)) this.xbdm.consoles.set(this.runtimeId, this)
  }

  public disconnect(): void {
    this.socket.destroy()
    this.socket.end()
    if (this.xbdm.consoles.has(this.runtimeId)) this.xbdm.consoles.delete(this.runtimeId)
  }

  private loadHandlers(): void {
    for (const x of defaultHandlers) {
      const handler = new x(this)
      this.handlers.set(handler.name, handler)
    }
  }

  public async executeCommand(command: string): Promise<CommandResponse>
  public async executeCommand(command: string, callback: (data: CommandResponse) => void): Promise<void>
  public async executeCommand(command: string, callback?: (data: CommandResponse) => void): Promise<CommandResponse | void> {
    return new Promise((result) => {
      const handler = this.handlers.get('CommandsHandler') as CommandsHandler
      handler.executeCommand(command, (data) => {
        const statusCode = parseInt(data.toString('utf8').substring(0, 3))
        const message = data.toString('utf8').slice(0, -2).slice(5)
        const format: CommandResponse = {
          statusCode,
          message,
        }

        if (callback) {
          return callback(format)
        } else {
          return result(format)
        }
      })
    })
  }

  public async xNotify(message: string): Promise<CommandResponse> {
    const command = `consolefeatures ver=2 type=12 params="A\\0\\A\\2\\2/${message.length}\\${Buffer.from(message, 'utf-8').toString('hex')}\\1\\0\\"`
    return await this.executeCommand(command)
  }

  public async getMemory(address: number, length: number): Promise<CommandResponse> {
    const command = `getmem addr=${address} length=${length}`
    return await this.executeCommand(command)
  }

  public async setMemory(address: number, data: any): Promise<CommandResponse> {
    const command = `setmem addr=${address} data=${data}`
    return await this.executeCommand(command)
  }
}

export {
  Xbox,
}
