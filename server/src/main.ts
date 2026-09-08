import 'dotenv/config';
import { createApp } from './app-bootstrap';

void createApp().then((app) => app.listen(process.env.PORT ?? 3000));
