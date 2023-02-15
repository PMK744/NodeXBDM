import { Socket as ISocket } from 'net'
 
class Socket {
  private readonly socket: ISocket

  public constructor() {
    this.socket = new ISocket()
    this.socket.setNoDelay(true)
    this.socket.setKeepAlive(true)
  }

  public connect(): void {
    this.socket.connect({
      host: "192.168.1.118",
      port: 730,
    }, (data?) => {
      console.log(data)
    })
  }

  public sendCommand(command: string): boolean {
    return this.socket.write(command + "\r\n")
  }

  public xNotify(message: string): void {
    let command =
      "consolefeatures ver=2" +
      ' type=12 params="A\\0\\A\\2\\' +
      2 +
      "/" +
      message.length +
      "\\" +
      Buffer.from(message, "utf8").toString("hex") +
      "\\" +
      1 +
      "\\";
      command += '0\\"';
      this.sendCommand(command)
  }
}

let sk = new Socket()
sk.connect()
setTimeout(() => {
  sk.xNotify("Hello World!");
}, 10000)
