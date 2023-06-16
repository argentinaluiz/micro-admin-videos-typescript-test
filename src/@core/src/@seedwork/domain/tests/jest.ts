import 'reflect-metadata';

global.fail = (message) => {
  throw new Error(message);
};
