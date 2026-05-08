import { fsrs } from 'ts-fsrs';

export const scheduler = fsrs({
    request_retention: 0.9,
    enable_fuzz: true,
})