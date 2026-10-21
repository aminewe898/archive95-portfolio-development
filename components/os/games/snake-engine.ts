export const SNAKE_SIZE = 20
export type Direction = 'up' | 'down' | 'left' | 'right'
export type Point = { x: number; y: number }
export type SnakeState = {
  snake: Point[]
  direction: Direction
  turned: boolean
  food: Point | null
  score: number
  status: 'ready' | 'playing' | 'paused' | 'lost' | 'won'
}
export type SnakeAction =
  | { type: 'turn'; direction: Direction }
  | { type: 'tick'; random: number }
  | { type: 'reset'; random: number }
  | { type: 'toggle' }
  | { type: 'pause' }

const vectors: Record<Direction, Point> = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
  left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
}
const opposite: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' }
const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y

export function placeFood(snake: Point[], random: number): Point | null {
  const occupied = new Set(snake.map(p => p.y * SNAKE_SIZE + p.x))
  const available: Point[] = []
  for (let y = 0; y < SNAKE_SIZE; y++) for (let x = 0; x < SNAKE_SIZE; x++) {
    if (!occupied.has(y * SNAKE_SIZE + x)) available.push({ x, y })
  }
  return available[Math.min(available.length - 1, Math.floor(Math.max(0, Math.min(1, random)) * available.length))] ?? null
}

export function createSnakeGame(random?: number): SnakeState {
  const snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }]
  return { snake, direction: 'right', turned: false, food: random === undefined ? { x: 13, y: 10 } : placeFood(snake, random), score: 0, status: 'ready' }
}

export function snakeReducer(state: SnakeState, action: SnakeAction): SnakeState {
  if (action.type === 'reset') return createSnakeGame(action.random)
  if (action.type === 'pause') return state.status === 'playing' ? { ...state, status: 'paused' } : state
  if (action.type === 'toggle') {
    if (state.status === 'ready' || state.status === 'paused') return { ...state, status: 'playing' }
    return state.status === 'playing' ? { ...state, status: 'paused' } : state
  }
  if (action.type === 'turn') {
    if ((state.status !== 'ready' && state.status !== 'playing') || state.turned || action.direction === opposite[state.direction]) return state
    return { ...state, status: 'playing', direction: action.direction, turned: action.direction !== state.direction }
  }
  if (state.status !== 'playing') return state
  const vector = vectors[state.direction]
  const head = { x: state.snake[0].x + vector.x, y: state.snake[0].y + vector.y }
  const eats = state.food !== null && same(head, state.food)
  const body = eats ? state.snake : state.snake.slice(0, -1)
  if (head.x < 0 || head.y < 0 || head.x >= SNAKE_SIZE || head.y >= SNAKE_SIZE || body.some(p => same(p, head))) {
    return { ...state, status: 'lost', turned: false }
  }
  const snake = [head, ...state.snake]
  if (!eats) snake.pop()
  const food = eats ? placeFood(snake, action.random) : state.food
  return { ...state, snake, food, turned: false, score: state.score + (eats ? 10 : 0), status: food === null ? 'won' : 'playing' }
}
