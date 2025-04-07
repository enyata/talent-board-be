import dayjs from "dayjs";
import pino from "pino";

const transport = pino.transport({
  target: "pino-pretty",
});

const log = pino(
  {
    base: { pid: false },
    timestamp: () => `,"time":"${dayjs().format()}"`,
  },
  transport,
);

export const closeLogger = async () => {
  await transport.end();
};

export default log;
