import test from 'ava';
import { Message, MQ, MT } from '../src';

test('Message constructor', async (t) => {
  await t.throws(() => new Message());
});
