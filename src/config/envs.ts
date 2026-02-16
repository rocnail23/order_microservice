import * as Joi from 'joi';
import 'dotenv/config';

export interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
  NATS_SERVER: string;
}

const envSchema = Joi.object<EnvVars>({
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().required(),
  NATS_SERVER: Joi.string().default('nats://nats:4222'),
})
  .unknown(true)
  .required();

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const { value, error } = envSchema.validate(process.env, {
  allowUnknown: true,
  abortEarly: false,
  convert: true,
});

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}
console.log(value.DATABASE_URL);
export const envs: EnvVars = {
  PORT: value.PORT,
  DATABASE_URL: value.DATABASE_URL,
  NATS_SERVER: value.NATS_SERVER,
};
