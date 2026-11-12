// Klondike rules and Windows Solitaire scoring, kept free of React so they can be checked with `pnpm test:sol`.
export type Card = { suit: number; rank: number; up: boolean } // suits: 0 ♠, 1 ♥, 2 ♦, 3 ♣
export type Scoring = 'standard' | 'vegas' | 'none'
export type Rules = { draw: 1 | 3; scoring: Scoring }
export type Game = { stock: Card[]; waste: Card[]; foundations: Card[][]; tableau: Card[][]; moves: number; won: boolean; score: number; passes: number }
export type Source = { pile: 'waste' } | { pile: 'foundation'; index: number } | { pile: 'tableau'; index: number; card: number }
export type Target = { pile: 'foundation' | 'tableau'; index: number }

export const DEFAULT_RULES: Rules = { draw: 1, scoring: 'none' }
export const isRed = (card: Card) => card.suit === 1 || card.suit === 2
// Standard scores never drop below zero; Vegas is a running balance that starts 52 dollars down.
const settle = (score: number, rules: Rules) => (rules.scoring === 'standard' ? Math.max(0, score) : rules.scoring === 'vegas' ? score : 0)

export function deal(random: () => number = Math.random, rules: Rules = DEFAULT_RULES): Game {
  const deck: Card[] = []
  for (let suit = 0; suit < 4; suit++) for (let rank = 1; rank <= 13; rank++) deck.push({ suit, rank, up: false })
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  const tableau: Card[][] = []
  for (let column = 0; column < 7; column++) {
    const pile = deck.splice(0, column + 1)
    pile[pile.length - 1] = { ...pile[pile.length - 1], up: true }
    tableau.push(pile)
  }
  return { stock: deck, waste: [], foundations: [[], [], [], []], tableau, moves: 0, won: false, score: rules.scoring === 'vegas' ? -52 : 0, passes: 0 }
}

export const canStack = (card: Card, onto: Card | undefined) => (onto ? onto.up && isRed(onto) !== isRed(card) && onto.rank === card.rank + 1 : card.rank === 13)
export const canFound = (card: Card, pile: Card[]) => (pile.length ? pile[pile.length - 1].suit === card.suit && pile[pile.length - 1].rank + 1 === card.rank : card.rank === 1)

/** Vegas allows one pass through the deck when drawing one card and three when drawing three. */
export const canRecycle = (game: Game, rules: Rules) => game.waste.length > 0 && (rules.scoring !== 'vegas' || game.passes + 1 < (rules.draw === 3 ? 3 : 1))

/** Turn one or three cards from the stock; when the stock is empty, the waste goes back face down. */
export function draw(game: Game, rules: Rules = DEFAULT_RULES): Game {
  if (game.won) return game
  if (game.stock.length) {
    const count = Math.min(rules.draw, game.stock.length)
    const turned = game.stock.slice(-count).reverse().map((card) => ({ ...card, up: true }))
    return { ...game, stock: game.stock.slice(0, -count), waste: [...game.waste, ...turned], moves: game.moves + 1 }
  }
  if (!canRecycle(game, rules)) return game
  const passes = game.passes + 1
  // Standard scoring: 100 points per extra pass when drawing one; 20 per pass after the third when drawing three.
  const penalty = rules.scoring !== 'standard' ? 0 : rules.draw === 1 ? 100 : passes >= 3 ? 20 : 0
  return { ...game, stock: [...game.waste].reverse().map((card) => ({ ...card, up: false })), waste: [], moves: game.moves + 1, passes, score: settle(game.score - penalty, rules) }
}

function lift(game: Game, from: Source): Card[] {
  if (from.pile === 'waste') return game.waste.slice(-1)
  if (from.pile === 'foundation') return game.foundations[from.index]?.slice(-1) ?? []
  const cards = game.tableau[from.index]?.slice(from.card) ?? []
  return cards.length && cards.every((card) => card.up) ? cards : []
}

/** Returns the new game, or null when the rules do not allow the move. */
export function move(game: Game, from: Source, to: Target, rules: Rules = DEFAULT_RULES): Game | null {
  if (game.won) return null
  const cards = lift(game, from)
  if (!cards.length) return null
  if (from.pile !== 'waste' && from.pile === to.pile && from.index === to.index) return null
  if (to.pile === 'foundation' ? cards.length !== 1 || !canFound(cards[0], game.foundations[to.index]) : !canStack(cards[0], game.tableau[to.index][game.tableau[to.index].length - 1])) return null

  const next: Game = { ...game, waste: [...game.waste], foundations: game.foundations.map((p) => [...p]), tableau: game.tableau.map((p) => [...p]), moves: game.moves + 1 }
  let turned = false
  if (from.pile === 'waste') next.waste.pop()
  else if (from.pile === 'foundation') next.foundations[from.index].pop()
  else {
    const pile = next.tableau[from.index]
    pile.splice(from.card)
    if (pile.length && !pile[pile.length - 1].up) {
      pile[pile.length - 1] = { ...pile[pile.length - 1], up: true }
      turned = true
    }
  }
  if (to.pile === 'foundation') next.foundations[to.index].push(...cards)
  else next.tableau[to.index].push(...cards)

  let gain = 0
  if (rules.scoring === 'standard') {
    if (to.pile === 'foundation') gain += from.pile === 'foundation' ? 0 : 10
    else if (from.pile === 'waste') gain += 5
    else if (from.pile === 'foundation') gain -= 15
    if (turned) gain += 5
  } else if (rules.scoring === 'vegas') {
    if (to.pile === 'foundation' && from.pile !== 'foundation') gain += 5
    if (from.pile === 'foundation' && to.pile === 'tableau') gain -= 5
  }
  next.score = settle(game.score + gain, rules)
  next.won = next.foundations.every((pile) => pile.length === 13)
  return next
}

/** Double-click behaviour: send a single card to whichever foundation accepts it. */
export function toFoundation(game: Game, from: Source, rules: Rules = DEFAULT_RULES): Game | null {
  if (from.pile === 'foundation') return null
  for (let index = 0; index < 4; index++) {
    const result = move(game, from, { pile: 'foundation', index }, rules)
    if (result) return result
  }
  return null
}

/** A timed standard game loses 2 points for every 10 seconds played. */
export const tick = (game: Game, seconds: number, rules: Rules): Game => (rules.scoring === 'standard' && !game.won && seconds > 0 && seconds % 10 === 0 ? { ...game, score: settle(game.score - 2, rules) } : game)

/** Winning a timed standard game earns 700,000 divided by the seconds played; games of 30 seconds or less earn nothing. */
export const winBonus = (seconds: number, rules: Rules) => (rules.scoring === 'standard' && seconds > 30 ? Math.round(700000 / seconds) : 0)
