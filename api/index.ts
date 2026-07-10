import { app } from '../server';

// Disable Vercel's default body parser so Express can process the raw request stream
export const config = {
  api: {
    bodyParser: false,
  },
};

export default app;
