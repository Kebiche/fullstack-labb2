import { Router } from 'express';
import multer from 'multer';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';

export function createImageRouter() {
    const router = Router();

    const upload = multer({
        storage: multer.diskStorage({
            destination: config.uploadDirectory,
            filename: (req, file, cb) => {
                const unique = Date.now() + '-' + Math.round(Math.random() * 1000);
                cb(null, unique + path.extname(file.originalname));
            },
        }),
        limits: { fileSize: 10 * 1024 * 1024 },
    }).single('image');

    router.post('/', upload, (request, response) => {
        if (!request.file) {
            return response.status(400).json({ message: 'Ingen fil skickades' });
        }
        response.status(201).json({
            filename: request.file.filename,
            url: `/api/images/${request.file.filename}`,
            uploadedBy: request.user.username,
        });
    });

    router.get('/:filename', async (request, response) => {
        try {
            const filePath = path.join(config.uploadDirectory, request.params.filename);
            const data = await readFile(filePath);
            response.send(data);
        } catch {
            response.status(404).json({ message: 'Bilden hittades inte' });
        }
    });

    return router;
}