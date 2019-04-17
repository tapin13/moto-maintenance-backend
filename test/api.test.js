const api = require('../libs/apilib');

test('hello', () => {
    const send = jest.fn();
    const res = {
        send,
    };
    api.hello({}, res);

    expect(send.mock.calls).toHaveLength(1);
    expect(send.mock.calls[0][0]).toEqual({ hello: 'Welcome to API' });
});

