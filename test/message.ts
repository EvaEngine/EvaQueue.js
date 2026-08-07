import test from 'ava';
import Message, { CommandMessage } from '../src/message.js';

test('message', async (t) => {
  const msg = new Message({ foo: 'bar' });
  t.deepEqual(msg.content, { foo: 'bar' });
});

test('command', async (t) => {
  const msg = new CommandMessage({ name: 'foo', spec: { spec1: 1, spec2: 'go' } });
  t.is(msg.getCommand(), 'foo --spec1 1 --spec2 go');
});
