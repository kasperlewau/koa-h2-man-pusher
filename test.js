import test from 'ava';
import subject from '.';

test('it is defined', t => {
  t.true(!!subject);
});

test('it is a function', t => {
  t.true(typeof subject === 'function');
});

test('it returns a function', t => {
  const fn = subject();
  t.true(typeof fn === 'function');
});
