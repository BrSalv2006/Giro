import { createApp } from './app.js';
import { getEnv } from './config/env.js';

const app = await createApp();
const { PORT } = getEnv();
app.listen(PORT, () => console.log(`Giro backend listening on port ${PORT}`));
