import { withEffectiveStageOrder } from "../stage-order";

it("preserves configured order and assigns legacy null rows after it", () => {
  expect(withEffectiveStageOrder([
    { id: "new", order: 0 },
    { id: "qualified", order: 10 },
    { id: "proposal", order: null },
    { id: "won", order: null },
  ])).toEqual([
    { id: "new", order: 0 },
    { id: "qualified", order: 10 },
    { id: "proposal", order: 20 },
    { id: "won", order: 30 },
  ]);
});

it("provides a usable sequence when all legacy stages lack order values", () => {
  expect(withEffectiveStageOrder([{ order: null }, { order: null }])).toEqual([
    { order: 0 },
    { order: 10 },
  ]);
});
