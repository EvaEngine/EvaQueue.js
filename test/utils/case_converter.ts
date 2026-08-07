import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toSnakeCase, toCamelCase } from '../../src/utils/case_converter.js';

describe('case_converter', () => {
  it('toSnakeCase converts camelCase keys', () => {
    assert.deepStrictEqual(
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
  });

  it('toCamelCase converts snake_case keys', () => {
    assert.deepStrictEqual(
      {
        fooBar: {
          barFoo: 2,
        },
      },
      toCamelCase({
        foo_bar: {
          bar_foo: 2,
        },
      }),
    );
  });

  it('toCamelCase handles arrays', () => {
    assert.deepStrictEqual(
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

  it('toSnakeCase handles arrays', () => {
    assert.deepStrictEqual(
      [{
        foo_bar: 1,
        bar_baz: 2,
      }],
      toSnakeCase([{
        fooBar: 1,
        barBaz: 2,
      }]),
    );
  });

  it('toCamelCase returns null for null input', () => {
    assert.strictEqual(toCamelCase(null as any), null);
  });

  it('toSnakeCase returns null for null input', () => {
    assert.strictEqual(toSnakeCase(null as any), null);
  });

  it('toCamelCase returns undefined for undefined input', () => {
    assert.strictEqual(toCamelCase(undefined as any), undefined);
  });

  it('toSnakeCase returns undefined for undefined input', () => {
    assert.strictEqual(toSnakeCase(undefined as any), undefined);
  });

  it('toCamelCase returns primitive values unchanged', () => {
    assert.strictEqual(toCamelCase('string' as any), 'string');
    assert.strictEqual(toCamelCase(42 as any), 42);
    assert.strictEqual(toCamelCase(true as any), true);
  });

  it('toSnakeCase returns primitive values unchanged', () => {
    assert.strictEqual(toSnakeCase('string' as any), 'string');
    assert.strictEqual(toSnakeCase(42 as any), 42);
    assert.strictEqual(toSnakeCase(true as any), true);
  });

  it('toCamelCase handles empty object', () => {
    assert.deepStrictEqual(toCamelCase({}), {});
  });

  it('toSnakeCase handles empty object', () => {
    assert.deepStrictEqual(toSnakeCase({}), {});
  });

  it('toCamelCase handles nested arrays', () => {
    assert.deepStrictEqual(
      toCamelCase({
        user_list: [
          { first_name: 'John', last_name: 'Doe' },
          { first_name: 'Jane', last_name: 'Smith' },
        ],
      }),
      {
        userList: [
          { firstName: 'John', lastName: 'Doe' },
          { firstName: 'Jane', lastName: 'Smith' },
        ],
      },
    );
  });

  it('toSnakeCase handles nested arrays', () => {
    assert.deepStrictEqual(
      toSnakeCase({
        userList: [
          { firstName: 'John', lastName: 'Doe' },
        ],
      }),
      {
        user_list: [
          { first_name: 'John', last_name: 'Doe' },
        ],
      },
    );
  });
});
