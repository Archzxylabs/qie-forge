import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

export async function loadValidators(schemaRoot) {
  const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
  addFormats(ajv);
  const names = (await readdir(schemaRoot)).filter((name) => name.endsWith('.schema.json')).sort();
  const definitions = await Promise.all(names.map(async (name) => ({
    name: name.replace('.schema.json', ''),
    schema: JSON.parse(await readFile(path.join(schemaRoot, name), 'utf8')),
  })));
  for (const { schema } of definitions) ajv.addSchema(schema);
  const validators = Object.fromEntries(definitions.map(({ name, schema }) => [name, ajv.getSchema(schema.$id)]));
  return (name, value, label = name) => {
    const validate = validators[name];
    if (!validate) throw new Error(`Unknown schema: ${name}`);
    if (!validate(value)) throw new Error(`${label}: ${ajv.errorsText(validate.errors, { separator: '; ' })}`);
  };
}
