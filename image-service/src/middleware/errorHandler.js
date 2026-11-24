import multer from 'multer';

export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }
  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return response.status(status).json({ message: 'Skicka en bild i fältet image, högst 10 MB, och ett patientId.' });
  }
  if (error.type === 'entity.too.large') {
    return response.status(413).json({ message: 'Annoteringen är för stor.' });
  }
  if (error instanceof SyntaxError && error.status === 400) {
    return response.status(400).json({ message: 'Anropet innehåller ogiltig JSON.' });
  }
  const status = error.status || 500;
  if (status === 401) {
    response.set('WWW-Authenticate', 'Basic realm="image-service"');
  }
  if (status >= 500) {
    console.error('Bildtjänsten kunde inte utföra anropet:', error.message);
  }
  const message = status < 500 ? error.message : 'Tjänsten kunde inte utföra anropet. Försök igen senare.';
  response.status(status).json({ message });
}
