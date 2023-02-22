import { Xbox } from './Xbox'
 
class xbdm {
  public readonly consoles: Map<string, Xbox>

  public constructor() {
    this.consoles = new Map<string, Xbox>()
  }

  public connect(ip = 'jtag', callback?: (connceted: boolean) => void): Xbox {
    const console = new Xbox(this, ip)
    console.connect((connected) => {
      if (connected) {
        this.consoles.set(console.runtimeId, console)
        if (callback) return callback(true)
      } else {
        if (callback) return callback(false)
      }
    })

    return console
  }
}

export {
  xbdm,
}

const xd = new xbdm()
const xbox = xd.connect("192.168.1.118", (connected) => {
  if (!connected) return
  // xbox.xNotify("Hello World!!!!")
  xbox.once('Connected', () => {
    console.log('Connected to xbox')
    xbox.xNotify('Hello World!')
    xbox.executeCommand('magicboot', (data) => {
      console.log(data)
    })
  })
})
