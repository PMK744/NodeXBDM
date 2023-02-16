import type { Xbox } from '../'
import type { CommandResponse } from '../../types'

import { genUuid } from '../../utils'

class CommandHandler {
  private readonly xbox: Xbox
  private readonly que: Map<string, { id: string, command: string, callback: (data: string) => void }>
  private currentCommand: string
  private interval: NodeJS.Timer
  private running: boolean

  public constructor(xbox: Xbox) {
    this.xbox = xbox
    this.que = new Map()
    this.currentCommand = "null"
    this.running = false

    // Handle Socket Data
    // this.handleCommands()
    this.xbox.socket.on('data', this.handleCommandData.bind(this))
  }

  private handleCommandData(data: Buffer): void {
    const message = data.toString('utf-8')
    const command = this.que.get(this.currentCommand)
    console.log(this.currentCommand)
    if (command) {
      command.callback(message)
      this.que.delete(this.currentCommand)
    }
    this.currentCommand = Array.from(this.que.values())[0]?.id
    if (!this.currentCommand) return
    this.xbox.socket.write(`${this.que.get(this.currentCommand).command}\r\n`)
  }

  // private handleCommands(): void {
  //   this.interval = setInterval(() => {
  //     this.running = false
  //     for (const [id, x] of this.que) {
  //       if (this.running) return
  //       if (x.ran) {
  //         this.que.delete(id)
  //       } else {
  //         this.running = true
  //         this.xbox.socket.write(x.command)
  //         this.que.get(id).ran = true
  //         this.xbox.socket.once('data', (data) => {
  //           this.que.get(id).callback(data.toString('utf-8'))
  //         })
  //       }
  //     }
  //   }, 20)
  // }

  public async executeCommand(command: string, callback: (data: string) => void): Promise<any> {
    const id = genUuid()
    this.que.set(id, {
      id,
      command: `${command}\r\n`,
      callback,
    })
  }
}

export {
  CommandHandler,
}