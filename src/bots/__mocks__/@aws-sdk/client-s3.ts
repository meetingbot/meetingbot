const S3Client = jest.fn(() => {console.log('S3Client called')});

export { S3Client };