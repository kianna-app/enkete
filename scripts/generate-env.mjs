import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const envFile = existsSync('.env') ? parseEnvFile(readFileSync('.env', 'utf8')) : {};
const supabaseUrl = process.env.SUPABASE_URL || envFile.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || envFile.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

mkdirSync('src/environments', { recursive: true });

writeFileSync(
  'src/environments/environment.ts',
  `export const environment = {
  supabaseUrl: ${JSON.stringify(supabaseUrl)},
  supabaseAnonKey: ${JSON.stringify(supabaseAnonKey)}
};
`
);

function parseEnvFile(contents) {
  return contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((values, line) => {
      const separatorIndex = line.indexOf('=');

      if (separatorIndex === -1) {
        return values;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
      values[key] = value;
      return values;
    }, {});
}
