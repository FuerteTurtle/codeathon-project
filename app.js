import dotenv from "dotenv";
import { App } from "octokit";
import { createNodeMiddleware } from "octokit";
import fs from "fs";
import http from "http";

dotenv.config();

const {
  APP_ID: appId,
  WEBHOOK_SECRET: webhookSecret,
  PRIVATE_KEY_PATH: privateKeyPath,
} = process.env;
const privateKey = fs.readFileSync(privateKeyPath, "utf8");

const app = new App({
  appId: appId,
  privateKey: privateKey,
  webhooks: { secret: webhookSecret },
});

const message =
  "I see you have a new PR here! Imma do some Trello automations for you...";

async function handlePullRequestOpened({ octokit, payload }) {
  console.log(
    `Receieved a pull request event for #${payload.pull_request.number}`
  );
  try {
    await octokit.request(
      "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
      {
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        issue_number: payload.pull_request.number,
        body: message,
        headers: { "x-github-api-version": "2022-11-28" },
      }
    );
  } catch (error) {
    if (error.response) {
      console.error(
        `Error! Status: ${error.response.status}. Message: ${error.response.data.message}`
      );
    } else {
      console.error(error);
    }
  }
}

app.webhooks.on("pull_request.opened", handlePullRequestOpened);

app.webhooks.onError((error) => {
  if (error.name === "AggregateError") {
    console.error(`Error processing request: ${error.event}`);
  } else {
    console.error(error);
  }
});

const port = 3000;
const host = "localhost";
const path = "/api/webhook";
const localWebhookUrl = `http://${host}:${port}${path}`;

const middleware = createNodeMiddleware(app.webhooks, { path });

http.createServer(middleware).listen(port, () => {
  console.log(`Server is listening for events at: ${localWebhookUrl}`);
  console.log("Press Ctrl + C to quit.");
});
