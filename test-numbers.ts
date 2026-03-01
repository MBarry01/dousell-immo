import { numberToWordsFr } from './lib/number-to-words';

const testValues = [
    150000,
    0,
    -50,
    "150000" as any,
    null as any,
    undefined as any,
    NaN as any
];

for (const val of testValues) {
    try {
        console.log(`Value ${val} -> ${numberToWordsFr(val)}`);
    } catch (err: any) {
        console.error(`Error with ${val}: ${err.message}`);
    }
}
