const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const server = require('./server'); // Assuming your Express server is exported in a file named server.js

jest.mock('axios');
jest.mock('fs');
jest.mock('child_process');

// Mock environment variable
process.env.OPENAI_API_KEY = 'test-api-key';

// Mock implementation for fs.existsSync and fs.writeFileSync
fs.existsSync.mockImplementation((path) => true);
fs.writeFileSync.mockImplementation((path, data) => {});

// Mock implementation of exec
const execMock = (command, callback) => {
    callback(null, 'stdout', 'stderr');
};
exec.mockImplementation(execMock);

afterAll((done) => {
    server.close(done);
});

describe('POST /api/process', () => {
    it('should return 400 if request body is invalid', async () => {
        const response = await request(server)
            .post('/api/process')
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid request body');
    });

    it('should return processed output for valid request', async () => {
        axios.post.mockResolvedValue({
            data: {
                choices: [
                    { message: { content: 'Processed code' } }
                ]
            }
        });

        const response = await request(server)
            .post('/api/process')
            .send({ code: 'code', action: 'comments', language: 'javascript', model: 'text-davinci-003' });

        expect(response.status).toBe(200);
        expect(response.body.output).toContain('Processed code');
    });

    it('should handle internal server error', async () => {
        axios.post.mockRejectedValue(new Error('Internal server error'));

        const response = await request(server)
            .post('/api/process')
            .send({ code: 'code', action: 'comments', language: 'javascript', model: 'text-davinci-003' });

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Failed to process code');
    });
});

describe('POST /api/generate-docs', () => {
    it('should return 400 if request body is invalid', async () => {
        const response = await request(server)
            .post('/api/generate-docs')
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid request body');
    });

    it('should return documentation URL for valid request', async () => {
        const response = await request(server)
            .post('/api/generate-docs')
            .send({ code: 'code', language: 'javascript' });

        expect(response.status).toBe(200);
        expect(response.body.docUrl).toContain('/docs/index.html');
    });

    it('should handle internal server error', async () => {
        exec.mockImplementation((command, callback) => {
            callback(new Error('Internal server error'), null, null);
        });

        const response = await request(server)
            .post('/api/generate-docs')
            .send({ code: 'code', language: 'javascript' });

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Failed to generate documentation');
    });
});