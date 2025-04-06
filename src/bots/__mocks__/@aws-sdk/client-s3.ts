import { jest } from '@jest/globals';

const S3Client = jest.fn(function (params) {
	console.log('S3Client called with params:', params);
	this.send = jest.fn((params) => {
        console.log('S3Client send called with params:', params);
    }); // Mock the send method
    this.destroy = jest.fn(); // Mock the destroy method
});
const PutObjectCommand = jest.fn(function (params) {
	console.log('PutObjectCommand called with params:', params);
});

export { S3Client, PutObjectCommand };