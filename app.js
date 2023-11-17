import dotenv from "dotenv";
import { createServer } from "node:http";
import { App, createNodeMiddleware } from "octokit";
import fs from "fs";
import completeGHField from "./trello.js";

dotenv.config();

const {
  APP_ID: appId,
  WEBHOOK_SECRET: webhookSecret,
  PRIVATE_KEY_PATH: privateKeyPath,
} = process.env;
const privateKey = fs.readFileSync(privateKeyPath, "utf8");

const app = new App({
  appId,
  privateKey,
  webhooks: { secret: webhookSecret },
  oauth: { clientId: null, clientSecret: null },
});

app.webhooks.on("issues.opened", ({ octokit, payload }) => {
  return octokit.rest.issues.createComment({
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    issue_number: payload.issue.number,
    body: "Hello, World!",
  });
});

app.webhooks.on("pull_request.opened", async ({ octokit, payload }) => {
  await completeGHField(payload.pull_request.html_url);
  return octokit.rest.issues.createComment({
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    issue_number: payload.pull_request.number,
    body: "hello, Pull request World",
  });
});

app.webhooks.onError((error) => {
  if (error.name === "AggregateError") {
    error.errors.forEach((err) => {
      const errorMessage = err.message
        ? `${err.name}: ${err.message}`
        : "Error: An Unspecified error occurred";
      console.error(`Error processing request: ${errorMessage}`);
      console.error("Request details:", err.request);
      console.error("Response details:", err.response);
    });
  } else {
    const errorMessage = error.message
      ? `${error.name}: ${error.message}`
      : "Error: An Unspecified error occurred";
    console.error(errorMessage);
    console.error("Request details:", error.request);
    console.error("Response details:", error.response);
  }
});

// Your app can now receive webhook events at `/api/github/webhooks`
createServer(createNodeMiddleware(app)).listen(3000);
