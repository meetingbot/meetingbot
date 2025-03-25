
const superjson = {
    serialize: jest.fn((data) => ({ json: JSON.stringify(data), meta: null })),
    deserialize: jest.fn((data: any) => JSON.parse(data.json)),
};

export default superjson;