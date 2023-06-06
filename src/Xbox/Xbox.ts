import type { xbdm } from '../index'
import type { CommandsHandler } from './handlers/Commands'
import type {
  CommandResponse,
} from '../types'

import { Socket } from 'net'
import { EventEmitter } from 'events'
import AbstractHandler from './handlers/AbstractHandler'
import { defaultHandlers } from './handlers'
import {
  genUuid,
  stringToHex,
} from '../utils'

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
    this.socket.once('error', (err) => {
      const code = (err as any)?.code
      if (code === "ECONNREFUSED") return callback(false)
    })
    this.socket.connect({
      host: this.ip,
      port: 730,
    }, (data?) => {
      if (data === undefined) {
        this.socket.once('data', () => {
          this.loadHandlers()
          this.emit('Connected', this)
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

  public async getCPUKey(): Promise<string> {
    const command = "consolefeatures ver=2 type=10 params=\"A\\0\\A\\0\\\""
    const result = await this.executeCommand(command)

    return result.message
  }

  // 0 = off
  // 128 = green
  // 8 = red
  // 136 = orange
  public async setLEDs(top_left: number, top_right: number, bottom_left: number, bottom_right: number): Promise<CommandResponse> {
    const command = `consolefeatures ver=2 type=14 params=\"A\\0\\A\\4\\1\\${top_left}\\1\\${top_right}\\1\\${bottom_left}\\1\\${bottom_right}\\\"`
    return await this.executeCommand(command)
  }

  public async resolveFunction(module: string, ordinal: number): Promise<number> {
    const command = "consolefeatures ver=" + 2 +
      " type=9 params=\"A\\0\\A\\2\\" + 2 + "/" +
      module.length + "\\" + stringToHex(module) + "\\" +
      1 + "\\" + ordinal + "\\\"";
    const res = await this.executeCommand(command)
    const address = parseInt(res.message, 16)

    return address
  }

  public callVoidByAddress(address: number, paramaters: (string | number | boolean)[]): void {
    this.callArgs(true, 0, undefined, 0, address, 0, false, paramaters)
  }

  public callVoidByModule(module: string, ordinal: number, paramaters: (string | number | boolean)[]): void {
    this.callArgs(true, 0, module, ordinal, 0, 0, false, paramaters)
  }

  // TODO: Add return values
  private callArgs(thread: boolean, type: number, module: string | number, ordinal: number | string, address: number, arraySize: number, vm: boolean, paramaters: any[]): void {
    const hexed = []
    for (const entry of paramaters) {
      if (isNaN(entry as any)) {
        hexed.push(`7/${(entry as string).length}\\${stringToHex(entry as string)}\\`)
      } else if ((entry as any) === true || (entry as any) === false) {
        switch (entry as boolean) {
          case true:
            hexed.push('1/\\1\\')
            break
          case false:
            hexed.push('1/\\0\\')
            break
        }
      } else {
        hexed.push(`1\\${entry}\\`)
      }
    }
    let commandData = `${hexed.join('')}"`
    const command = "consolefeatures ver=" + 2 + " type=" + type + (thread ? " system" : "") +
      (module != undefined ? " module=\"" + module + "\" ord=" + ordinal : "") +
      (vm ? " VM" : "") +
      " as=" + arraySize + " params=\"A\\" + address.toString(16) + "\\A\\" + paramaters.length + "\\" + commandData

    this.executeCommand(command)
  }
}

export {
  Xbox,
}
