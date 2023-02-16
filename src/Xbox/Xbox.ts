import type { xbdm } from '../index'

import { Socket } from 'net'
import { genUuid } from '../utils'
import { CommandHandler } from './handlers/index'

class Xbox {
  public readonly socket: Socket
  public readonly xbdm: xbdm
  public readonly ip: string
  public readonly runtimeId: string

  // Handlers
  public readonly commands: CommandHandler

  public constructor(xbdm: xbdm, ip: string) {
    this.xbdm = xbdm
    this.ip = ip
    this.runtimeId = genUuid()
    this.socket = new Socket()
    this.socket.setNoDelay(true)
    this.socket.setKeepAlive(true)

    // Handlers
    this.commands = new CommandHandler(this)
  }

  public connect(callback: (connected?: boolean) => void): void {
      this.socket.connect({
        host: this.ip,
        port: 730,
      }, (data?) => {
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
}
  
//   public xNotify(message: string): void {
//     const command = `consolefeatures ver=2 type=12 params="A\\0\\A\\2\\2/${message.length}\\${Buffer.from(message, 'utf-8').toString('hex')}\\1\\0\\"`
//     this.sendCommand(command, () => {})
//   }

export {
  Xbox,
}
