import {
  createCallerFactory,
  createTRPCRouter,
  baseProcedure,
} from "~/server/trpc/main";
import { orchestrationRouter } from "./routers/orchestration";

export const appRouter = createTRPCRouter({
  orchestration: orchestrationRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
