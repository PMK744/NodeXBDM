import type { Xbox } from '..'

import AbstractHandler from './AbstractHandler'
import { genUuid } from '../../utils'

class CommandsHandler extends AbstractHandler {
  protected readonly xbox: Xbox
  protected readonly que: Map<string, { command: string, id: string, callback: (data: Buffer) => void }>
  protected readonly interval: NodeJS.Timer
  protected dataBuf: Buffer = undefined
  public readonly name: string

  public constructor(xbox: Xbox) {
    super()
    this.xbox = xbox
    this.name = "CommandsHandler"
    this.que = new Map()
    this.interval = setInterval(() => this.tick(this.dataBuf), 30)
    this.xbox.socket.on('data', (data) => this.dataBuf = data)
    this.xbox.socket.on('close', () => clearInterval(this.interval))
  }

  private tick(data: Buffer): void {
    if (data) {
      this.dataBuf = undefined
      const command = Array.from(this.que.values())[0]
      if (command.callback) command.callback(data)
      this.que.delete(command.id)
    } else {
      const nextCommand = Array.from(this.que.values())[0]
      if (!nextCommand) return
      this.xbox.socket.write(nextCommand.command)
    }
  }

  public executeCommand(command: string, callback?: (data: Buffer) => void): void {
    const format = `${command}\r\n`
    const id = genUuid()
    this.que.set(id, {
      command: format,
      id: id,
      callback,
    })
  }
}

export {
  CommandsHandler,
}