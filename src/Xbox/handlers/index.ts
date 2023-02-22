export * from './AbstractHandler'
import { CommandsHandler } from './Commands'

const defaultHandlers = [
  CommandsHandler,
]

export {
  defaultHandlers,
}
