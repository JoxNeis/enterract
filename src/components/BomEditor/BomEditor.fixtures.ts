import type { BomComponent } from './bom'

/** A shelving unit: frame (sub-assembly) + shelves + fasteners. */
export const shelfBom: BomComponent[] = [
  {
    id: 'frame',
    item: 'ASM-FRAME',
    description: 'Frame sub-assembly',
    qty: 1,
    uom: 'PCS',
    children: [
      { id: 'post', item: 'POST-180', description: 'Upright post 180 cm', qty: 4, uom: 'PCS' },
      { id: 'beam', item: 'BEAM-90', description: 'Cross beam 90 cm', qty: 8, uom: 'PCS', scrapPercent: 2 },
      { id: 'bolt-f', item: 'BOLT-M8', description: 'Hex bolt M8 × 30', qty: 16, uom: 'PCS' },
    ],
  },
  { id: 'shelf', item: 'SHELF-90', description: 'Shelf board 90 × 40', qty: 5, uom: 'PCS', scrapPercent: 5 },
  { id: 'bolt', item: 'BOLT-M8', description: 'Hex bolt M8 × 30', qty: 20, uom: 'PCS' },
]
