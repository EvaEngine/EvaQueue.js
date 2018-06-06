import test from 'ava';
import { toSnakeCase, toCamelCase } from '../../src/utils/case_converter';

test('toSnakeCase', async (t) => {
  t.deepEqual(
    {
      foo_bar: {
        bar_foo: 2,
      },
    },
    toSnakeCase({
      fooBar: {
        barFoo: 2,
      },
    }),
  );

  t.deepEqual(
    [{
      fooBar: {
        barFoo: 2,
      },
    }],
    toCamelCase([{
      foo_bar: {
        bar_foo: 2,
      },
    }]),
  );
});
