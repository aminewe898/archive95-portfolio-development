import assert from 'node:assert/strict'
import { canFound, canStack, deal, draw, move, toFoundation } from '../components/os/games/solitaire-engine.ts'

const card = (suit, rank, up = true) => ({ suit, rank, up })
const empty = () => ({ stock: [], waste: [], foundations: [[], [], [], []], tableau: [[], [], [], [], [], [], []], moves: 0, won: false })

// Deal: 52 unique cards, 1..7 per column, only the top card face up, 24 in the stock.
let seed = 7
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
const game = deal(random)
const all = [...game.stock, ...game.tableau.flat()]
assert.equal(all.length, 52)
assert.equal(new Set(all.map((c) => `${c.suit}-${c.rank}`)).size, 52)
assert.equal(game.stock.length, 24)
game.tableau.forEach((pile, i) => {
  assert.equal(pile.length, i + 1)
  assert.deepEqual(pile.map((c) => c.up), pile.map((_, j) => j === pile.length - 1))
})

// Drawing turns one card; an empty stock recycles the waste in the original order.
let drawn = game
for (let i = 0; i < 24; i++) drawn = draw(drawn)
assert.equal(drawn.stock.length, 0)
assert.equal(drawn.waste.length, 24)
assert.ok(drawn.waste.every((c) => c.up))
const recycled = draw(drawn)
assert.equal(recycled.waste.length, 0)
assert.deepEqual(recycled.stock.map((c) => `${c.suit}-${c.rank}`), game.stock.map((c) => `${c.suit}-${c.rank}`))
assert.ok(recycled.stock.every((c) => !c.up))
const nothing = empty()
assert.equal(draw(nothing), nothing, "nothing to draw leaves the game unchanged")

// Stacking rules.
assert.ok(canStack(card(1, 12), card(0, 13)), 'red queen on black king')
assert.ok(!canStack(card(3, 12), card(0, 13)), 'same colour is refused')
assert.ok(!canStack(card(1, 11), card(0, 13)), 'rank must be one lower')
assert.ok(canStack(card(2, 13), undefined), 'a king may start an empty column')
assert.ok(!canStack(card(2, 12), undefined), 'only a king may start an empty column')
assert.ok(canFound(card(0, 1), []))
assert.ok(!canFound(card(0, 2), []))
assert.ok(canFound(card(0, 2), [card(0, 1)]))
assert.ok(!canFound(card(1, 2), [card(0, 1)]))

// Moving a run flips the card underneath and keeps the run in order.
const run = empty()
run.tableau[0] = [card(3, 9, false), card(1, 6), card(0, 5)]
run.tableau[1] = [card(3, 7)]
const moved = move(run, { pile: 'tableau', index: 0, card: 1 }, { pile: 'tableau', index: 1 })
assert.ok(moved)
assert.deepEqual(moved.tableau[1].map((c) => c.rank), [7, 6, 5])
assert.deepEqual(moved.tableau[0], [card(3, 9, true)])
assert.equal(run.tableau[0].length, 3, 'the original game is not mutated')
assert.equal(move(run, { pile: 'tableau', index: 0, card: 0 }, { pile: 'tableau', index: 1 }), null, 'face-down cards cannot be lifted')
assert.equal(move(run, { pile: 'tableau', index: 0, card: 2 }, { pile: 'tableau', index: 1 }), null, 'illegal stack is refused')
assert.equal(move(run, { pile: 'tableau', index: 0, card: 1 }, { pile: 'foundation', index: 0 }), null, 'only one card at a time reaches a foundation')

// Waste and foundation moves.
const waste = empty()
waste.waste = [card(2, 1)]
const founded = toFoundation(waste, { pile: 'waste' })
assert.ok(founded)
assert.equal(founded.foundations[0].length, 1)
assert.equal(founded.waste.length, 0)
assert.equal(toFoundation({ ...waste, waste: [card(2, 5)] }, { pile: 'waste' }), null)
const back = { ...empty(), foundations: [[card(1, 1), card(1, 2)], [], [], []] }
back.tableau[0] = [card(0, 3)]
assert.ok(move(back, { pile: 'foundation', index: 0 }, { pile: 'tableau', index: 0 }), 'a card may come back from a foundation')

// Winning: the last king completes four full foundations.
const nearly = empty()
nearly.foundations = [0, 1, 2, 3].map((suit) => Array.from({ length: suit === 3 ? 12 : 13 }, (_, i) => card(suit, i + 1)))
nearly.tableau[0] = [card(3, 13)]
const won = toFoundation(nearly, { pile: 'tableau', index: 0, card: 0 })
assert.ok(won?.won)
assert.equal(move(won, { pile: 'foundation', index: 0 }, { pile: 'tableau', index: 1 }), null, 'a finished game is frozen')
assert.equal(draw(won), won)

console.log('Solitaire checks passed: deal, draw, recycle, stacking, runs, foundations, win.')
