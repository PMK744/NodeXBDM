import { Xbox } from './Xbox'
 
class xbdm {
  public readonly consoles: Map<string, Xbox>

  public constructor() {
    this.consoles = new Map<string, Xbox>()
  }

  public connect(ip = 'jtag', callback?: (connceted: undefined | Xbox) => void): Xbox {
    const console = new Xbox(this, ip)
    console.connect((connected) => {
      if (connected) {
        this.consoles.set(console.runtimeId, console)
        console.once('Connected', (xbox) => {
          if (callback) return callback(xbox)
        })
      } else {
        if (callback) return callback(undefined)
      }
    })

    return console
  }
}

export {
  xbdm,
}
