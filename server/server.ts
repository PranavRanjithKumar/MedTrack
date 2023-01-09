import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

// eslint-disable-next-line import/first
import app from './app';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
  console.log(`Project directory ${__dirname}`);
});
